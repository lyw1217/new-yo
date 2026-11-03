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

// Stop accepting connections, let in-flight requests finish, then exit (forced after SHUTDOWN_TIMEOUT_MS).
const SHUTDOWN_TIMEOUT_MS = 15_000; // longer than the 10 s upstream timeout
for (const sig of ["SIGINT", "SIGTERM"] as const) {
  process.once(sig, () => {
    console.log(`[newyo] ${sig}, shutting down`);
    setTimeout(() => {
      console.error("[newyo] in-flight requests did not finish, forcing exit");
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS).unref();
    server.close(() => process.exit(0));
  });
}
