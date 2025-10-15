import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { readFileSync } from "fs";
import { DatabaseHandler } from "./utils/database.js";
import {
  assessmentAnswerSchema,
  downloadRequestSchema,
} from "./types/assessment-answers.js";
import "dotenv/config";

const app = new Hono();

const database = new DatabaseHandler({
  host: process.env.MYSQL_DATABASE_HOST || "localhost",
  user: process.env.MYSQL_DATABASE_USER || "fairuser",
  password: process.env.MYSQL_DATABASE_PASSWORD || "fairpassword",
  database: process.env.MYSQL_DATABASE_NAME || "fair_aware",
  port: Number(process.env.MYSQL_DATABASE_PORT) || 3306,
});

const ASSESSMENT_HOST = process.env.HOST_INSTANCE || "unknown";

const customLogger = (message: string, ...rest: string[]) => {
  console.log(message, ...rest);
};

app.use("/api/*", logger(customLogger));
app.use(
  "/api/*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  })
);

app.use("/*", serveStatic({ root: "./public" }));

// Dirty wrapper to reuse and serve legacy HTML application.
app.get("/", (c) => {
  try {
    const html = readFileSync("/public/index.html", "utf-8");
    return c.html(html);
  } catch (error) {
    console.error("Failed to read index.html:", error);
    return c.text("Internal Server Error", 500);
  }
});

// Submit assessment answers
app.post("/api/submit", async (c) => {
  try {
    let body;
    try {
      body = await c.req.json();
    } catch (jsonError) {
      customLogger("/api/submit - body parse error");
      return c.json(
        {
          success: false,
          message: "Invalid or missing JSON body",
        },
        400
      );
    }

    const result = assessmentAnswerSchema.safeParse(body);

    if (!result.success) {
      customLogger("/api/submit - validation failed");
      return c.json(
        {
          success: false,
          message: "Validation failed",
          errors: result.error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        400
      );
    }

    const insertId = await database.setAnswer(result.data, ASSESSMENT_HOST);
    customLogger("/api/submit - answer submitted", `${insertId}`);

    return c.json(
      {
        success: true,
        message: "Assessment submitted successfully",
        id: insertId,
      },
      201
    );
  } catch (error) {
    console.error("Failed to submit assessment:", error);
    return c.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      500
    );
  }
});

// Download assessment answers
app.post("/api/download", async (c) => {
  try {
    let body;
    try {
      body = await c.req.json();
    } catch (jsonError) {
      customLogger("/api/download - body parse error");
      return c.json(
        {
          success: false,
          message: "Invalid or missing JSON body",
        },
        400
      );
    }

    const result = downloadRequestSchema.safeParse(body);

    if (!result.success) {
      customLogger("/api/download - validation failed");
      return c.json(
        {
          success: false,
          message: "Validation failed",
          errors: result.error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        400
      );
    }

    const isAuthenticated = await database.validateUser(
      result.data.email,
      result.data.password
    );

    if (!isAuthenticated) {
      customLogger("/api/download - authentication failed");
      return c.json(
        {
          success: false,
          message: "Authentication failed",
        },
        401
      );
    }

    const answers = await database.getAnswers(
      result.data.code,
      ASSESSMENT_HOST
    );

    if (answers.length === 0) {
      return c.json(
        {
          success: false,
          message: "No answers found for the provided code",
        },
        404
      );
    }

    return c.json(
      {
        success: true,
        message: "Answers retrieved successfully",
        data: answers,
        count: answers.length,
      },
      200
    );
  } catch (error) {
    console.error("Failed to download answers:", error);
    return c.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      500
    );
  }
});

app.get("/api/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

app.notFound((c) => {
  return c.json(
    {
      success: false,
      message: "Route not found",
    },
    404
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
    500
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
  }
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
  shutdown("uncaughtException");
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  shutdown("unhandledRejection");
});
