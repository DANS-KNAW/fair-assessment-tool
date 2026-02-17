import type { MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";
import type { Pool } from "mysql2/promise";
import type { AdminEnv } from "../types.js";
import { deleteSessionCookie, validateSessionToken } from "./session.js";

export function requireAuth(pool: Pool): MiddlewareHandler<AdminEnv> {
  return async (c, next) => {
    const token = getCookie(c, "admin_session");
    const isApiRoute = c.req.path.startsWith("/admin/api/");

    if (!token) {
      if (isApiRoute) {
        return c.json({ error: "unauthorized" }, 401);
      }
      return c.redirect("/admin/login");
    }

    const result = await validateSessionToken(pool, token);

    if (!result) {
      deleteSessionCookie(c);
      if (isApiRoute) {
        return c.json({ error: "unauthorized" }, 401);
      }
      return c.redirect("/admin/login");
    }

    c.set("user", result.user);
    c.set("session", result.session);
    await next();
  };
}
