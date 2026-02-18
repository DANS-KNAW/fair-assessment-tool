import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { csrf } from "hono/csrf";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import type { Pool } from "mysql2/promise";
import { requireAuth } from "./auth/middleware.js";
import { hashPassword, verifyPassword } from "./auth/password.js";
import {
  createSession,
  deleteSessionCookie,
  generateSecureRandomString,
  hashSecret,
  invalidateSession,
  setSessionCookie,
  validateSessionToken,
} from "./auth/session.js";
import { AssessmentDetailPage } from "./components/pages/AssessmentDetailPage.js";
import { CourseCodeDetailPage } from "./components/pages/CourseCodeDetailPage.js";
import { CourseCodesPage } from "./components/pages/CourseCodesPage.js";
import { DashboardPage } from "./components/pages/DashboardPage.js";
import { LoginPage } from "./components/pages/LoginPage.js";
import { SetupPage } from "./components/pages/SetupPage.js";
import { UserDetailPage } from "./components/pages/UserDetailPage.js";
import { UsersPage } from "./components/pages/UsersPage.js";
import type { AssessmentDetailRow } from "./db/queries.js";
import {
  checkEmailExists,
  createCourseCode,
  createInvitation,
  createUser,
  deleteInvitationsByUserId,
  deleteUser,
  deleteUserSessions,
  getAllSubmissionsForDownload,
  getCourseCodeByCode,
  getInvitationByTokenHash,
  getSubmissionById,
  getSubmissionsForDownload,
  getUnaffiliatedSubmissionsForDownload,
  getUserByEmail,
  getUserById,
  isOwnedCourseCode,
  setUserPassword,
  updateLastLoginAt,
  updateUserStatus,
} from "./db/queries.js";
import type { AdminEnv } from "./types.js";

function formatDownloadTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

const CSV_HEADER =
  "Host,Date,Code,Domain,Role,Organization,FQ1,FQ1-i,FQ2,FQ2-i,FQ3,FQ3-i,AQ1,AQ1-i,AQ2,AQ2-i,IQ1,IQ1-i,RQ1,RQ1-i,RQ2,RQ2-i,RQ3,RQ3-i,RQ4,RQ4-i,Not understandable,Missing metrics,General feedback,Awareness raised\n";

function buildCsv(rows: AssessmentDetailRow[]): string {
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
        if (str.includes(",") || str.includes('"')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      })
      .join(",");
  });
  return CSV_HEADER + csvRows.join("\n");
}

export function createAdminApp(pool: Pool) {
  const app = new Hono<AdminEnv>();

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

    if (user.status === "pending") {
      return c.html(
        <LoginPage error="Please complete your account setup first." />,
        403,
      );
    }
    if (user.status === "disabled") {
      return c.html(<LoginPage error="Your account has been disabled." />, 403);
    }

    await updateLastLoginAt(pool, user.id);
    const token = await createSession(pool, user.id);
    setSessionCookie(c, token);
    return c.redirect("/admin");
  });

  // ── Setup routes (unprotected) ──

  app.get("/setup", async (c) => {
    const token = c.req.query("token");
    if (!token || token.length !== 48) {
      return c.redirect("/admin/login");
    }

    const tokenHash = await hashSecret(token);
    const invitation = await getInvitationByTokenHash(
      pool,
      Buffer.from(tokenHash),
    );

    if (!invitation) {
      return c.redirect("/admin/login");
    }

    const now = Math.floor(Date.now() / 1000);
    if (now > invitation.expires_at) {
      return c.html(<SetupPage token="" expired />);
    }

    if (invitation.user_status !== "pending") {
      return c.redirect("/admin/login");
    }

    return c.html(<SetupPage token={token} />);
  });

  app.post("/setup", csrf(), async (c) => {
    const formData = await c.req.parseBody();
    const token = formData.token;
    const password = formData.password;
    const confirmPassword = formData.confirm_password;

    if (
      typeof token !== "string" ||
      token.length !== 48 ||
      typeof password !== "string" ||
      typeof confirmPassword !== "string"
    ) {
      return c.redirect("/admin/login");
    }

    const tokenHash = await hashSecret(token);
    const invitation = await getInvitationByTokenHash(
      pool,
      Buffer.from(tokenHash),
    );

    if (!invitation) {
      return c.redirect("/admin/login");
    }

    const now = Math.floor(Date.now() / 1000);
    if (now > invitation.expires_at) {
      return c.html(<SetupPage token="" expired />);
    }

    if (password.length < 8) {
      return c.html(
        <SetupPage
          token={token}
          error="Password must be at least 8 characters."
        />,
      );
    }
    if (password !== confirmPassword) {
      return c.html(
        <SetupPage token={token} error="Passwords do not match." />,
      );
    }

    const passwordHash = await hashPassword(password);
    await setUserPassword(pool, invitation.user_id, passwordHash);
    await deleteInvitationsByUserId(pool, invitation.user_id);

    return c.redirect("/admin/login");
  });

  // Prevent browser from caching authenticated responses (OWASP baseline)
  app.use("*", async (c, next) => {
    await next();
    const path = c.req.path;
    if (
      path !== "/admin/login" &&
      path !== "/admin/login/" &&
      path !== "/admin/setup" &&
      path !== "/admin/setup/"
    ) {
      c.res.headers.set("Cache-Control", "no-store, private");
    }
  });

  // ── Protected routes ──

  app.use("*", async (c, next) => {
    const path = c.req.path;
    if (
      path === "/admin/login" ||
      path === "/admin/login/" ||
      path === "/admin/setup" ||
      path === "/admin/setup/"
    ) {
      return next();
    }
    return requireAuth(pool)(c, next);
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

  app.get("/api/download", async (c) => {
    const user = c.get("user");
    const userId = user.role === "trainer" ? user.id : undefined;
    const rows = await getAllSubmissionsForDownload(pool, userId);

    if (rows.length === 0) {
      return c.redirect(
        `/admin/course-codes?flash=${encodeURIComponent("No submissions found.")}&flashVariant=error`,
      );
    }

    const csv = buildCsv(rows);
    const timestamp = formatDownloadTimestamp();
    const filename = `FAIRAware_all_results_${timestamp}.csv`;

    c.header("Content-Type", "text/csv; charset=utf-8");
    c.header("Content-Disposition", `attachment; filename="${filename}"`);
    return c.body(csv);
  });

  app.get("/api/download/_unaffiliated", async (c) => {
    const user = c.get("user");
    if (user.role !== "admin") {
      return c.redirect("/admin/course-codes");
    }

    const rows = await getUnaffiliatedSubmissionsForDownload(pool);

    if (rows.length === 0) {
      return c.redirect(
        `/admin/course-codes?flash=${encodeURIComponent("No unaffiliated submissions found.")}&flashVariant=error`,
      );
    }

    const csv = buildCsv(rows);
    const timestamp = formatDownloadTimestamp();
    const filename = `FAIRAware_unaffiliated_results_${timestamp}.csv`;

    c.header("Content-Type", "text/csv; charset=utf-8");
    c.header("Content-Disposition", `attachment; filename="${filename}"`);
    return c.body(csv);
  });

  app.get("/api/download/:code", async (c) => {
    const user = c.get("user");
    const code = c.req.param("code");

    if (user.role === "trainer") {
      const owned = await isOwnedCourseCode(pool, code, user.id);
      if (!owned) {
        return c.redirect("/admin/course-codes");
      }
    }

    const rows = await getSubmissionsForDownload(pool, code);

    if (rows.length === 0) {
      return c.redirect(
        `/admin/course-codes/${encodeURIComponent(code)}?flash=${encodeURIComponent("No submissions found for this course code.")}&flashVariant=error`,
      );
    }

    const csv = buildCsv(rows);
    const timestamp = formatDownloadTimestamp();
    const filename = `FAIRAware_${code}_results_${timestamp}.csv`;

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
    const rawVariant = c.req.query("flashVariant");
    const flashVariant =
      rawVariant === "success" || rawVariant === "error"
        ? rawVariant
        : undefined;
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

  app.get("/course-codes/_unaffiliated", async (c) => {
    const user = c.get("user");
    if (user.role !== "admin") {
      return c.redirect("/admin/course-codes");
    }
    const page = Math.max(1, Number(c.req.query("page")) || 1);
    return c.html(
      <CourseCodeDetailPage
        pool={pool}
        user={user}
        currentPath={c.req.path}
        code=""
        page={page}
        unaffiliated
      />,
    );
  });

  app.get("/course-codes/:code", async (c) => {
    const user = c.get("user");
    const code = c.req.param("code");

    if (user.role === "trainer") {
      const owned = await isOwnedCourseCode(pool, code, user.id);
      if (!owned) {
        return c.redirect("/admin/course-codes");
      }
    }

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

    if (user.role === "trainer") {
      const submission = await getSubmissionById(pool, idParam);
      if (!submission || !submission.cq1) {
        return c.redirect("/admin");
      }
      const owned = await isOwnedCourseCode(pool, submission.cq1, user.id);
      if (!owned) {
        return c.redirect("/admin");
      }
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

  // ── User management routes (admin only) ──

  app.get("/users", async (c) => {
    const user = c.get("user");
    if (user.role !== "admin") {
      return c.redirect("/admin");
    }
    const flash = c.req.query("flash");
    const rawVariant = c.req.query("flashVariant");
    const flashVariant =
      rawVariant === "success" || rawVariant === "error"
        ? rawVariant
        : undefined;
    return c.html(
      <UsersPage
        pool={pool}
        user={user}
        currentPath={c.req.path}
        flash={flash}
        flashVariant={flashVariant}
      />,
    );
  });

  app.post("/users", csrf(), async (c) => {
    const user = c.get("user");
    if (user.role !== "admin") {
      return c.redirect("/admin");
    }

    const formData = await c.req.parseBody();
    const email =
      typeof formData.email === "string" ? formData.email.trim() : "";
    const firstName =
      typeof formData.firstName === "string" ? formData.firstName.trim() : "";
    const lastName =
      typeof formData.lastName === "string" ? formData.lastName.trim() : "";
    const role = formData.role;

    if (!email || !firstName || !lastName) {
      return c.redirect(
        `/admin/users?flash=${encodeURIComponent("All fields are required.")}&flashVariant=error`,
      );
    }
    if (role !== "admin" && role !== "trainer") {
      return c.redirect(
        `/admin/users?flash=${encodeURIComponent("Invalid role.")}&flashVariant=error`,
      );
    }

    const exists = await checkEmailExists(pool, email);
    if (exists) {
      return c.redirect(
        `/admin/users?flash=${encodeURIComponent("A user with this email already exists.")}&flashVariant=error`,
      );
    }

    const name = `${firstName} ${lastName}`;
    const userId = await createUser(pool, { email, name, role });

    return c.redirect(
      `/admin/users/${userId}?flash=${encodeURIComponent("User created successfully.")}&flashVariant=success`,
    );
  });

  app.get("/users/:id", async (c) => {
    const user = c.get("user");
    if (user.role !== "admin") {
      return c.redirect("/admin");
    }
    const targetUserId = c.req.param("id");
    const flash = c.req.query("flash");
    const rawVariant = c.req.query("flashVariant");
    const flashVariant =
      rawVariant === "success" || rawVariant === "error"
        ? rawVariant
        : undefined;
    return c.html(
      <UserDetailPage
        pool={pool}
        user={user}
        currentPath={c.req.path}
        targetUserId={targetUserId}
        flash={flash}
        flashVariant={flashVariant}
      />,
    );
  });

  app.post("/api/users/:id/invite", async (c) => {
    const user = c.get("user");
    if (user.role !== "admin") {
      return c.json({ error: "forbidden" }, 403);
    }

    const targetUserId = c.req.param("id");
    const targetUser = await getUserById(pool, targetUserId);
    if (!targetUser || targetUser.status !== "pending") {
      return c.json({ error: "Invalid user" }, 400);
    }

    const token = generateSecureRandomString(48);
    const tokenHash = await hashSecret(token);
    const expiresAt = Math.floor(Date.now() / 1000) + 86400; // 24 hours

    await createInvitation(
      pool,
      targetUserId,
      Buffer.from(tokenHash),
      expiresAt,
    );

    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const host = c.req.header("host") || "localhost:3000";
    const url = `${protocol}://${host}/admin/setup?token=${token}`;

    return c.json({ url });
  });

  app.post("/users/:id/disable", csrf(), async (c) => {
    const user = c.get("user");
    if (user.role !== "admin") {
      return c.redirect("/admin");
    }
    const targetUserId = c.req.param("id");

    if (targetUserId === user.id) {
      return c.redirect(
        `/admin/users/${targetUserId}?flash=${encodeURIComponent("You cannot disable your own account.")}&flashVariant=error`,
      );
    }

    await updateUserStatus(pool, targetUserId, "disabled");
    await deleteUserSessions(pool, targetUserId);
    return c.redirect(
      `/admin/users/${targetUserId}?flash=${encodeURIComponent("User disabled.")}&flashVariant=success`,
    );
  });

  app.post("/users/:id/enable", csrf(), async (c) => {
    const user = c.get("user");
    if (user.role !== "admin") {
      return c.redirect("/admin");
    }
    const targetUserId = c.req.param("id");

    await updateUserStatus(pool, targetUserId, "active");
    return c.redirect(
      `/admin/users/${targetUserId}?flash=${encodeURIComponent("User enabled.")}&flashVariant=success`,
    );
  });

  app.post("/users/:id/delete", csrf(), async (c) => {
    const user = c.get("user");
    if (user.role !== "admin") {
      return c.redirect("/admin");
    }
    const targetUserId = c.req.param("id");

    if (targetUserId === user.id) {
      return c.redirect(
        `/admin/users/${targetUserId}?flash=${encodeURIComponent("You cannot delete your own account.")}&flashVariant=error`,
      );
    }

    const formData = await c.req.parseBody();
    if (formData.confirmation !== "delete") {
      return c.redirect(
        `/admin/users/${targetUserId}?flash=${encodeURIComponent("Deletion not confirmed.")}&flashVariant=error`,
      );
    }

    await deleteUser(pool, targetUserId);
    return c.redirect(
      `/admin/users?flash=${encodeURIComponent("User deleted.")}&flashVariant=success`,
    );
  });

  app.post("/users/:id/force-logout", csrf(), async (c) => {
    const user = c.get("user");
    if (user.role !== "admin") {
      return c.redirect("/admin");
    }
    const targetUserId = c.req.param("id");

    await deleteUserSessions(pool, targetUserId);
    return c.redirect(
      `/admin/users/${targetUserId}?flash=${encodeURIComponent("User sessions terminated.")}&flashVariant=success`,
    );
  });

  return app;
}
