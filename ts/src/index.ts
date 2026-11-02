import { serve } from "@hono/node-server";
import { createApp, DEFAULT_SCRAPER_URL } from "./app.js";

const port = Number(process.env.PORT);
if (!port) {
  console.error(`Wrong Value of environment : $PORT = '${process.env.PORT ?? ""}'`);
  process.exit(1);
}
const scraperUrl = process.env.SCRAPER_URL || DEFAULT_SCRAPER_URL;

const app = createApp({ scraperUrl });
const server = serve({ fetch: app.fetch, port }, (i) => console.log(`[newyo] http on :${i.port}, scraper ${scraperUrl}`));

for (const sig of ["SIGINT", "SIGTERM"] as const) {
  process.on(sig, () => {
    console.log(`[newyo] ${sig}, shutting down`);
    server.close();
    process.exit(0);
  });
}
