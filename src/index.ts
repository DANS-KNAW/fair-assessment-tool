import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { trimTrailingSlash } from "hono/trailing-slash";
import { seedDefaultAdmin, seedDefaultTrainer } from "./admin/db/seed.js";
import { createAdminApp } from "./admin/index.js";
import { createApiApp } from "./api/index.js";
import { DatabaseHandler } from "./utils/database.js";
import "dotenv/config";

const app = new Hono();

const database = new DatabaseHandler({
  host: process.env.MYSQL_DATABASE_HOST || "localhost",
  user: process.env.MYSQL_DATABASE_USER || "fairuser",
  password: process.env.MYSQL_DATABASE_PASSWORD || "fairpassword",
  database: process.env.MYSQL_DATABASE_NAME || "fair_aware",
  port: Number(process.env.MYSQL_DATABASE_PORT) || 3306,
});

const ASSESSMENT_HOST = process.env.ASSESSMENT_HOST || "unknown";

// Trim trailing slashes (redirects /admin/ → /admin on 404)
app.use(trimTrailingSlash());

// Sub-apps (must be before static file serving)
const adminApp = createAdminApp(database.getPool());
app.route("/admin", adminApp);

const apiApp = createApiApp(database, ASSESSMENT_HOST);
app.route("/api", apiApp);

app.use("/*", serveStatic({ root: "./public" }));

app.notFound((c) => {
  return c.json(
    {
      success: false,
      message: "Route not found",
    },
    404,
  );
});

// Global error handler
app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json(
    {
      success: false,
      message: "An unexpected error occurred",
    },
    500,
  );
});

const port = process.env.APPLICATION_PORT
  ? Number(process.env.APPLICATION_PORT)
  : 3000;
const server = serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
    const pool = database.getPool();
    seedDefaultAdmin(pool)
      .then(() => seedDefaultTrainer(pool))
      .catch((err) => {
        console.error("[admin] Failed to seed users:", err);
      });
  },
);

const shutdown = async (signal: string) => {
  console.log(`\n${signal} received, shutting down gracefully...`);

  // Close database connection pool
  try {
    await database.close();
    console.log("Database connections closed");
  } catch (error) {
    console.error("Error closing database:", error);
  }

  // Close HTTP server
  server.close((err) => {
    if (err) {
      console.error("Error closing server:", err);
      process.exit(1);
    }
    console.log("Server closed");
    process.exit(0);
  });

  // Force exit after 10 seconds if graceful shutdown fails
  setTimeout(() => {
    console.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});
