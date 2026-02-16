import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import type { AdminEnv } from "../types.js";
import { deleteSessionCookie, validateSessionToken } from "./session.js";

export const requireAuth = createMiddleware<AdminEnv>(async (c, next) => {
  const pool = c.env.pool;
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
});
