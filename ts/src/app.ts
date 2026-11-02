import { Hono, type Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { logger } from "hono/logger";

/**
 * NEW-YO: thin front for the scraping-news-go "scraper" service. Every route forwards to the scraper and
 * reshapes its answer for the KakaoTalk bot (texts use "@" as the line separator).
 */

export const DEFAULT_SCRAPER_URL = "http://lunchtoday.site:30200";
const UPSTREAM_TIMEOUT_MS = 10_000;

export interface AppDeps {
  scraperUrl: string;
  fetch?: typeof fetch;
  log?: boolean;
}

const PAPERS = [
  ["hankyung", "한국경제 Issue Today"],
  ["maekyung", "매일경제 매.세.지"],
  ["quicknews", "간추린뉴스"],
] as const;

export interface FcstItem {
  baseDate: string;
  baseTime: string;
  fcstDate: string;
  fcstTime: string;
  category: string;
  fcstValue: string;
  nx: number;
  ny: number;
}

const json = (c: Context, status: number, body: unknown) => c.json(body, status as ContentfulStatusCode);
const internalError = (c: Context) => json(c, 500, { status: 500, reason: "Internal Server Error" });
const badRequest = (c: Context, reason = "Bad Request") => json(c, 400, { status: 400, reason });

/**
 * Short-term forecast items (scraper order: 0 기온, 5 하늘상태, 6 강수형태, 7 강수확률, 9 강수량, 10 습도, 11 신적설)
 * to the bot's "@"-separated text. Same layout and padding as the Go ParseWeather.
 */
export function formatForecast(items: FcstItem[], name: string): string {
  if (items.length < 12) throw new Error(`forecast has ${items.length} items, need 12`);
  const [t] = items;
  let s = `${name}@`;
  s += `${t.fcstDate.slice(0, 4)}년 ${t.fcstDate.slice(4, 6)}월 ${t.fcstDate.slice(6, 8)}일 `;
  s += `${t.fcstTime.slice(0, 2)}시 예보@`;
  s += `${items[0].category} : ${items[0].fcstValue}@`;
  s += `${items[5].category}   : ${items[5].fcstValue}@`;
  s += `${items[6].category}   : ${items[6].fcstValue}@`;
  s += `${items[7].category}   : ${items[7].fcstValue}@`;
  if (items[6].fcstValue !== "없음") s += `${items[9].category}       : ${items[9].fcstValue}@`;
  s += `${items[10].category}          : ${items[10].fcstValue}`;
  if (items[11].fcstValue !== "적설없음") s += `@${items[11].category}: ${items[11].fcstValue}`;
  return s;
}

/** Mid-term forecast RSS text: split on "*" / "○", break the first part on "-", join with "@○". */
export function formatMidterm(contents: string): string {
  const parts = contents.split(/[*○]/).filter((p) => p.length > 0);
  if (parts.length === 0) throw new Error("empty mid-term forecast");
  return [...parts[0].split("-"), ...parts.slice(1)].join("@○");
}

export function createApp(deps: AppDeps): Hono {
  const fetchFn = deps.fetch ?? fetch;
  const scraper = deps.scraperUrl.replace(/\/+$/, "");

  const upstream = (path: string, params: [string, string][], method = "GET") => {
    const url = new URL(scraper + path);
    for (const [k, v] of params) url.searchParams.append(k, v);
    return fetchFn(url, { method, signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) });
  };

  const app = new Hono();
  if (deps.log !== false) app.use(logger());

  app.get("/", (c) => c.text("Hello NEW-YO!"));

  // /article?paper=hankyung|maekyung|quicknews ; anything else = all three
  app.get("/article", async (c) => {
    const auth = c.req.query("auth") ?? "";
    const paper = c.req.query("paper");
    const selected = PAPERS.filter(([id]) => id === paper);
    const contents: { paper: string; content: string }[] = [];
    for (const [id, title] of selected.length ? selected : PAPERS) {
      let status: number;
      let body: { contents?: unknown };
      try {
        const res = await upstream("/article", auth ? [["paper", id], ["auth", auth]] : [["paper", id]]);
        status = res.status;
        body = (await res.json()) as { contents?: unknown };
      } catch (err) {
        console.error(`[article] ${id}:`, err);
        return json(c, 500, { status: "fail", reason: "Internal Server Error" });
      }
      if (status !== 200) return json(c, status, { status, reason: body.contents ?? "" });
      const content = body.contents;
      contents.push({ paper: title, content: typeof content === "string" ? content : JSON.stringify(content ?? "") });
    }
    return c.json({ status: "success", contents });
  });

  // /weather?k1=&k2=&k3=&p=0|1  (short-term, by place keywords)  or  /weather?mid=<region>  (mid-term)
  app.get("/weather", async (c) => {
    const auth = c.req.query("auth") ?? "";
    const keywords = ["k1", "k2", "k3"].map((k) => c.req.query(k) ?? "").filter(Boolean);
    const mid = c.req.query("mid") ?? "";

    if (keywords.length) {
      const p = c.req.query("p") ?? "";
      if (!p) return badRequest(c, "Query p is invalid.");
      if (!/^[+-]?\d+$/.test(p)) return badRequest(c, "Query p is not integer.");
      if (Number(p) > 1) return badRequest(c, "Query p is invalid.");
      const params: [string, string][] = keywords.map((k, i) => [`k${i + 1}`, k]);
      params.push(["auth", auth], ["p", p]);
      try {
        const res = await upstream("/weather", params);
        if (res.status !== 200) return json(c, 404, { status: 404, reason: "Not Found" });
        const body = (await res.json()) as { contents?: FcstItem[]; name?: string };
        return c.text(formatForecast(body.contents ?? [], body.name ?? ""));
      } catch (err) {
        console.error("[weather] short-term:", err);
        return internalError(c);
      }
    }

    if (mid) {
      try {
        const res = await upstream("/weather", [["auth", auth], ["mid", mid]]);
        if (res.status !== 200) return json(c, 404, { status: 404, reason: "Not Found" });
        const body = (await res.json()) as { contents?: string };
        return c.text(formatMidterm(body.contents ?? ""));
      } catch (err) {
        console.error("[weather] mid-term:", err);
        return internalError(c);
      }
    }

    return badRequest(c);
  });

  // /romanization?query=<한글 이름>
  app.get("/romanization", async (c) => {
    const query = c.req.query("query") ?? "";
    if (!query) return badRequest(c);
    try {
      const res = await upstream("/romanization", [["query", query], ["auth", c.req.query("auth") ?? ""]]);
      if (res.status !== 200) return internalError(c);
      const body = (await res.json()) as { contents?: { name: string; score: string }[] };
      const name = body.contents?.[0]?.name;
      if (!name) return internalError(c);
      return c.text(`${query}을(를) 현행 로마자 표기법으로 바꾸면 ${name}`);
    } catch (err) {
      console.error("[romanization]", err);
      return internalError(c);
    }
  });

  // /papago?text=<text>  (scraper translates; it takes the text as a query param on POST)
  app.get("/papago", async (c) => {
    const text = c.req.query("text") ?? "";
    if (!text) return badRequest(c);
    try {
      const res = await upstream("/papago", [["text", text], ["auth", c.req.query("auth") ?? ""]], "POST");
      if (res.status !== 200) return internalError(c);
      const body = (await res.json()) as { contents?: string };
      if (!body.contents) return internalError(c);
      return c.text(body.contents);
    } catch (err) {
      console.error("[papago]", err);
      return internalError(c);
    }
  });

  app.notFound((c) => c.json({ status: "404", reason: "Not Found" }, 404));
  app.onError((err, c) => {
    console.error("[unhandled]", err);
    return internalError(c);
  });
  return app;
}
