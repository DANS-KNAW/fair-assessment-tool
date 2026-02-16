import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { csrf } from "hono/csrf";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import type { Pool } from "mysql2/promise";
import { requireAuth } from "./auth/middleware.js";
import { verifyPassword } from "./auth/password.js";
import {
  createSession,
  deleteSessionCookie,
  invalidateSession,
  setSessionCookie,
  validateSessionToken,
} from "./auth/session.js";
import { DashboardPage } from "./components/pages/DashboardPage.js";
import { LoginPage } from "./components/pages/LoginPage.js";
import { getUserByEmail } from "./db/queries.js";
import type { AdminEnv } from "./types.js";

export function createAdminApp(pool: Pool) {
  const app = new Hono<AdminEnv>();

  // Bind pool to all requests
  app.use("*", async (c, next) => {
    c.env = { pool };
    await next();
  });

  app.use("*", logger());
  app.use("*", secureHeaders());

  // ── Unprotected routes ──

  app.get("/login", async (c) => {
    // If already logged in, redirect to dashboard
    const token = getCookie(c, "admin_session");
    if (token) {
      const result = await validateSessionToken(pool, token);
      if (result) {
        return c.redirect("/admin");
      }
    }
    return c.html(<LoginPage />);
  });

  app.post("/login", csrf(), async (c) => {
    const formData = await c.req.parseBody();
    const email = formData.email;
    const password = formData.password;

    if (typeof email !== "string" || typeof password !== "string") {
      return c.html(
        <LoginPage error="Email and password are required." />,
        400,
      );
    }

    const user = await getUserByEmail(pool, email);
    if (!user || !user.password_hash) {
      return c.html(<LoginPage error="Invalid email or password." />, 401);
    }

    const valid = await verifyPassword(user.password_hash, password);
    if (!valid) {
      return c.html(<LoginPage error="Invalid email or password." />, 401);
    }

    const token = await createSession(pool, user.id);
    setSessionCookie(c, token);
    return c.redirect("/admin");
  });

  // Prevent browser from caching authenticated responses (OWASP baseline)
  app.use("*", async (c, next) => {
    await next();
    if (c.req.path !== "/admin/login" && c.req.path !== "/admin/login/") {
      c.res.headers.set("Cache-Control", "no-store, private");
    }
  });

  // ── Protected routes ──

  app.use("*", async (c, next) => {
    // Skip auth for login routes
    if (c.req.path === "/admin/login" || c.req.path === "/admin/login/") {
      return next();
    }
    return requireAuth(c, next);
  });

  app.get("/api/session", (c) => {
    return c.json({ status: "ok" }, 200);
  });

  app.post("/logout", async (c) => {
    const session = c.get("session");
    await invalidateSession(pool, session.id);
    deleteSessionCookie(c);
    return c.redirect("/admin/login");
  });

  app.get("/", async (c) => {
    const user = c.get("user");
    return c.html(
      <DashboardPage pool={pool} user={user} currentPath={c.req.path} />,
    );
  });

  return app;
}
