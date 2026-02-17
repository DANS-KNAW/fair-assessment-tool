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
import { AssessmentDetailPage } from "./components/pages/AssessmentDetailPage.js";
import { CourseCodeDetailPage } from "./components/pages/CourseCodeDetailPage.js";
import { CourseCodesPage } from "./components/pages/CourseCodesPage.js";
import { DashboardPage } from "./components/pages/DashboardPage.js";
import { LoginPage } from "./components/pages/LoginPage.js";
import { UsersPage } from "./components/pages/UsersPage.js";
import {
  createCourseCode,
  getCourseCodeByCode,
  getSubmissionsForDownload,
  getUserByEmail,
} from "./db/queries.js";
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

  app.get("/api/course-codes/check", async (c) => {
    const code = c.req.query("code")?.trim() ?? "";
    if (code === "") {
      return c.json({ available: false });
    }
    const existing = await getCourseCodeByCode(pool, code);
    return c.json({ available: existing === null });
  });

  app.get("/api/download/:code", async (c) => {
    const code = c.req.param("code");
    const rows = await getSubmissionsForDownload(pool, code);

    if (rows.length === 0) {
      return c.redirect(
        `/admin/course-codes/${encodeURIComponent(code)}?flash=${encodeURIComponent("No submissions found for this course code.")}&flashVariant=error`,
      );
    }

    const header =
      "Host,Date,Code,Domain,Role,Organization,FQ1,FQ1-i,FQ2,FQ2-i,FQ3,FQ3-i,AQ1,AQ1-i,AQ2,AQ2-i,IQ1,IQ1-i,RQ1,RQ1-i,RQ2,RQ2-i,RQ3,RQ3-i,RQ4,RQ4-i,Not understandable,Missing metrics,General feedback,Awareness raised\n";

    const csvRows = rows.map((row) => {
      const fields = [
        row.host,
        row.submission_date,
        row.cq1,
        row.yq1,
        row.yq2,
        row.yq3,
        row.fq1,
        row.fq1i,
        row.fq2,
        row.fq2i,
        row.fq3,
        row.fq3i,
        row.aq1,
        row.aq1i,
        row.aq2,
        row.aq2i,
        row.iq1,
        row.iq1i,
        row.rq1,
        row.rq1i,
        row.rq2,
        row.rq2i,
        row.rq3,
        row.rq3i,
        row.rq4,
        row.rq4i,
        row.qq1,
        row.qq2,
        row.qq3,
        row.qq4,
      ];
      return fields
        .map((val) => {
          const str = (val ?? "")
            .toString()
            .replace(/[\r\n\t]+/g, " ")
            .replace(/\s+/g, " ")
            .trim();
          if (str.includes(",") || str.includes('"') || str.includes("\n")) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(",");
    });

    const csv = header + csvRows.join("\n");
    const filename = `FAIRAware_${code}_results.csv`;

    c.header("Content-Type", "text/csv; charset=utf-8");
    c.header("Content-Disposition", `attachment; filename="${filename}"`);
    return c.body(csv);
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

  app.get("/course-codes", async (c) => {
    const user = c.get("user");
    const flash = c.req.query("flash");
    const flashVariant = c.req.query("flashVariant") as
      | "success"
      | "error"
      | undefined;
    return c.html(
      <CourseCodesPage
        pool={pool}
        user={user}
        currentPath={c.req.path}
        flash={flash}
        flashVariant={flashVariant}
      />,
    );
  });

  app.post("/course-codes", csrf(), async (c) => {
    const user = c.get("user");
    const formData = await c.req.parseBody();
    const code = formData.code;

    if (typeof code !== "string" || code.trim() === "") {
      return c.redirect(
        `/admin/course-codes?flash=${encodeURIComponent("Course code is required.")}&flashVariant=error`,
      );
    }

    const trimmedCode = code.trim();

    const existing = await getCourseCodeByCode(pool, trimmedCode);
    if (existing) {
      return c.redirect(
        `/admin/course-codes?flash=${encodeURIComponent(`Course code "${trimmedCode}" already exists.`)}&flashVariant=error`,
      );
    }

    await createCourseCode(pool, trimmedCode, user.id);
    return c.redirect(
      `/admin/course-codes?flash=${encodeURIComponent(`Course code "${trimmedCode}" created successfully.`)}&flashVariant=success`,
    );
  });

  app.get("/course-codes/:code", async (c) => {
    const user = c.get("user");
    const code = c.req.param("code");
    const page = Math.max(1, Number(c.req.query("page")) || 1);
    return c.html(
      <CourseCodeDetailPage
        pool={pool}
        user={user}
        currentPath={c.req.path}
        code={code}
        page={page}
      />,
    );
  });

  app.get("/assessments/:id", async (c) => {
    const user = c.get("user");
    const idParam = Number(c.req.param("id"));
    if (Number.isNaN(idParam) || idParam < 1) {
      return c.redirect("/admin");
    }
    const from = c.req.query("from") ?? null;
    return c.html(
      <AssessmentDetailPage
        pool={pool}
        user={user}
        currentPath={c.req.path}
        id={idParam}
        referer={from}
      />,
    );
  });

  app.get("/users", async (c) => {
    const user = c.get("user");
    if (user.role !== "admin") {
      return c.redirect("/admin");
    }
    return c.html(<UsersPage user={user} currentPath={c.req.path} />);
  });

  return app;
}
