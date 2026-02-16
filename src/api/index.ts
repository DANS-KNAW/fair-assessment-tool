import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import {
  assessmentAnswerSchema,
  downloadRequestSchema,
} from "../types/assessment-answers.js";
import type { DatabaseHandler } from "../utils/database.js";

const customLogger = (message: string, ...rest: string[]) => {
  console.log(message, ...rest);
};

export function createApiApp(
  database: DatabaseHandler,
  assessmentHost: string,
) {
  const app = new Hono();

  app.use("*", logger(customLogger));
  app.use(
    "*",
    cors({
      origin: "*",
      allowMethods: ["GET", "POST", "OPTIONS"],
      allowHeaders: ["Content-Type"],
    }),
  );

  // Submit assessment answers
  app.post("/submit", async (c) => {
    try {
      let body: Record<string, string>;
      try {
        body = await c.req.json();
      } catch (_jsonError) {
        customLogger("/api/submit - body parse error");
        return c.json(
          {
            success: false,
            message: "Invalid or missing JSON body",
          },
          400,
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
          400,
        );
      }

      const insertId = await database.setAnswer(result.data, assessmentHost);
      customLogger("/api/submit - answer submitted", `${insertId}`);

      return c.json(
        {
          success: true,
          message: "Assessment submitted successfully",
          id: insertId,
        },
        201,
      );
    } catch (error) {
      console.error("Failed to submit assessment:", error);
      return c.json(
        {
          success: false,
          message:
            error instanceof Error ? error.message : "Internal server error",
        },
        500,
      );
    }
  });

  // Download assessment answers
  app.post("/download", async (c) => {
    try {
      let body: Record<string, string>;
      try {
        body = await c.req.json();
      } catch (_jsonError) {
        customLogger("/api/download - body parse error");
        return c.json(
          {
            success: false,
            message: "Invalid or missing JSON body",
          },
          400,
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
          400,
        );
      }

      const isAuthenticated = await database.validateUser(
        result.data.email,
        result.data.password,
      );

      if (!isAuthenticated) {
        customLogger("/api/download - authentication failed");
        return c.json(
          {
            success: false,
            message: "Authentication failed",
          },
          401,
        );
      }

      const answers = await database.getAnswers(
        result.data.code,
        assessmentHost,
      );

      if (answers.length === 0) {
        return c.json(
          {
            success: false,
            message: "No answers found for the provided code",
          },
          404,
        );
      }

      return c.json(
        {
          success: true,
          message: "Answers retrieved successfully",
          data: answers,
          count: answers.length,
        },
        200,
      );
    } catch (error) {
      console.error("Failed to download answers:", error);
      return c.json(
        {
          success: false,
          message:
            error instanceof Error ? error.message : "Internal server error",
        },
        500,
      );
    }
  });

  app.get("/health", (c) => {
    return c.json({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  });

  return app;
}
