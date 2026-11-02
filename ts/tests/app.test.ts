import { test } from "node:test";
import assert from "node:assert/strict";
import { createApp, formatForecast, formatMidterm, type FcstItem } from "../src/app.js";

interface Call {
  method: string;
  url: URL;
}

type Handler = (url: URL, method: string) => Response | Promise<Response>;

function fakeScraper(handler: Handler) {
  const calls: Call[] = [];
  const fn = (async (input: URL | string, init?: RequestInit) => {
    const url = new URL(String(input));
    const method = init?.method ?? "GET";
    calls.push({ method, url });
    return handler(url, method);
  }) as typeof fetch;
  return { fn, calls };
}

const make = (handler: Handler) => {
  const f = fakeScraper(handler);
  return { app: createApp({ scraperUrl: "http://scraper:30200/", fetch: f.fn, log: false }), calls: f.calls };
};

const forecast = (overrides: Record<number, string> = {}): FcstItem[] =>
  Array.from({ length: 12 }, (_, i) => ({
    baseDate: "20240101",
    baseTime: "0500",
    fcstDate: "20240102",
    fcstTime: "0900",
    category: `C${i}`,
    fcstValue: overrides[i] ?? `v${i}`,
    nx: 60,
    ny: 127,
  }));

test("GET / greets", async () => {
  const { app } = make(() => new Response());
  const res = await app.request("/");
  assert.equal(await res.text(), "Hello NEW-YO!");
});

test("unknown path returns the Gin JSON 404", async () => {
  const { app } = make(() => new Response());
  const res = await app.request("/nope");
  assert.equal(res.status, 404);
  assert.deepEqual(await res.json(), { status: "404", reason: "Not Found" });
});

test("/article?paper=X proxies one paper; auth forwarded only when given", async () => {
  const { app, calls } = make((url) => Response.json({ contents: `news:${url.searchParams.get("paper")}` }));
  const res = await app.request("/article?paper=maekyung&auth=abc");
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { status: "success", contents: [{ paper: "매일경제 매.세.지", content: "news:maekyung" }] });
  assert.equal(calls[0].url.origin + calls[0].url.pathname, "http://scraper:30200/article");
  assert.equal(calls[0].url.searchParams.get("auth"), "abc");

  await app.request("/article?paper=hankyung");
  assert.equal(calls[1].url.searchParams.has("auth"), false);
});

test("/article without paper returns all three in order", async () => {
  const { app, calls } = make((url) => Response.json({ contents: url.searchParams.get("paper") }));
  const body = await (await app.request("/article")).json();
  assert.deepEqual(body.contents.map((c: { paper: string }) => c.paper), ["한국경제 Issue Today", "매일경제 매.세.지", "간추린뉴스"]);
  assert.deepEqual(calls.map((c) => c.url.searchParams.get("paper")), ["hankyung", "maekyung", "quicknews"]);
});

test("/article passes through scraper errors", async () => {
  const unauthorized = make(() => Response.json({ contents: "Unauthorized" }, { status: 401 }));
  const res = await unauthorized.app.request("/article?paper=quicknews");
  assert.equal(res.status, 401);
  assert.deepEqual(await res.json(), { status: 401, reason: "Unauthorized" });

  const down = make(() => Promise.reject(new Error("ECONNREFUSED")));
  const res2 = await down.app.request("/article");
  assert.equal(res2.status, 500);
  assert.deepEqual(await res2.json(), { status: "fail", reason: "Internal Server Error" });
});

test("/weather short-term forwards keywords and formats the forecast", async () => {
  const { app, calls } = make(() => Response.json({ contents: forecast({ 6: "비", 11: "1cm" }), name: "서울" }));
  const res = await app.request("/weather?k1=서울&k3=중구&p=1&auth=x");
  assert.equal(res.status, 200);
  const text = await res.text();
  assert.equal(
    text,
    "서울@2024년 01월 02일 09시 예보@C0 : v0@C5   : v5@C6   : 비@C7   : v7@C9       : v9@C10          : v10@C11: 1cm",
  );
  const q = calls[0].url.searchParams;
  assert.equal(q.get("k1"), "서울");
  assert.equal(q.get("k2"), "중구"); // renumbered like the Go loop
  assert.equal(q.get("p"), "1");
  assert.equal(q.get("auth"), "x");
});

test("formatForecast omits rain amount and snow when absent", () => {
  const s = formatForecast(forecast({ 6: "없음", 11: "적설없음" }), "n");
  assert.equal(s.includes("C9"), false);
  assert.equal(s.includes("C11"), false);
  assert.throws(() => formatForecast(forecast().slice(0, 5), "n"));
});

test("/weather short-term validates p", async () => {
  const { app, calls } = make(() => Response.json({}));
  const reason = async (path: string) => (await (await app.request(path)).json()).reason;
  assert.equal(await reason("/weather?k1=a"), "Query p is invalid.");
  assert.equal(await reason("/weather?k1=a&p=x"), "Query p is not integer.");
  assert.equal(await reason("/weather?k1=a&p=2"), "Query p is invalid.");
  assert.equal(calls.length, 0);
});

test("/weather upstream failures", async () => {
  const nf = make(() => new Response("", { status: 500 }));
  assert.equal((await nf.app.request("/weather?k1=a&p=0")).status, 404);
  const short = make(() => Response.json({ contents: forecast().slice(0, 3), name: "x" }));
  assert.equal((await short.app.request("/weather?k1=a&p=0")).status, 500);
});

test("/weather?mid= formats the mid-term text", async () => {
  const { app, calls } = make(() => Response.json({ contents: "(육상) 맑음-대체로 흐림 ○ (강수) 비 *기온 평년" }));
  const res = await app.request("/weather?mid=서울");
  assert.equal(await res.text(), "(육상) 맑음@○대체로 흐림 @○ (강수) 비 @○기온 평년");
  assert.equal(calls[0].url.searchParams.get("mid"), "서울");
  assert.equal(formatMidterm("a-b"), "a@○b");
  assert.throws(() => formatMidterm("○*"));
});

test("/weather with no query is 400", async () => {
  const { app } = make(() => Response.json({}));
  const res = await app.request("/weather");
  assert.equal(res.status, 400);
  assert.deepEqual(await res.json(), { status: 400, reason: "Bad Request" });
});

test("/romanization", async () => {
  const { app, calls } = make(() => Response.json({ contents: [{ name: "Hong Gildong", score: "99" }] }));
  assert.equal(await (await app.request("/romanization?query=홍길동")).text(), "홍길동을(를) 현행 로마자 표기법으로 바꾸면 Hong Gildong");
  assert.equal(calls[0].url.pathname, "/romanization");
  assert.equal((await app.request("/romanization")).status, 400);
  const empty = make(() => Response.json({ contents: [] }));
  assert.equal((await empty.app.request("/romanization?query=x")).status, 500);
});

test("/papago forwards as POST with query params", async () => {
  const { app, calls } = make(() => Response.json({ contents: "hello" }));
  const res = await app.request("/papago?text=안녕&auth=a");
  assert.equal(await res.text(), "hello");
  assert.equal(calls[0].method, "POST");
  assert.equal(calls[0].url.searchParams.get("text"), "안녕");
  assert.equal((await app.request("/papago")).status, 400);
  const bad = make(() => new Response("", { status: 403 }));
  assert.equal((await bad.app.request("/papago?text=x")).status, 500);
});
