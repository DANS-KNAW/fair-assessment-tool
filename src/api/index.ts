import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { assessmentAnswerSchema } from "../types/assessment-answers.js";
import type { DatabaseHandler } from "../utils/database.js";

export function createApiApp(
  database: DatabaseHandler,
  assessmentHost: string,
) {
  const app = new Hono();

  app.use("*", logger());
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
        console.log("/api/submit - body parse error");
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
        console.log("/api/submit - validation failed");
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
      console.log("/api/submit - answer submitted", `${insertId}`);

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
          message: "Internal server error",
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
