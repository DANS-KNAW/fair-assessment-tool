import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { readFileSync } from "fs";

const app = new Hono();

app.use("/*", serveStatic({ root: "./public" }));

app.get("/", (c) => {
  const html = readFileSync("./src/views/index.html", "utf-8");
  return c.html(html);
});

serve(
  {
    fetch: app.fetch,
    port: 3010,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
