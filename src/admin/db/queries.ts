import type { Pool, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { FAIR_QUESTIONS } from "../utils/fair-score.js";

// ── Shared SQL fragments ──

const FAIR_SCORE_SQL = FAIR_QUESTIONS.map(
  (q) => `(CASE WHEN LOWER(${q.key}) = 'yes' THEN 1 ELSE 0 END)`,
).join(" +\n         ");

const ASSESSMENT_DETAIL_COLUMNS = `id, host, submission_date, cq1,
            yq1, yq2, yq3,
            fq1, fq1i, fq2, fq2i, fq3, fq3i,
            aq1, aq1i, aq2, aq2i,
            iq1, iq1i,
            rq1, rq1i, rq2, rq2i, rq3, rq3i, rq4, rq4i,
            qq1, qq2, qq3, qq4`;

// ── Session queries ──

interface SessionRow extends RowDataPacket {
  id: string;
  user_id: string;
  secret_hash: Buffer;
  last_verified_at: number;
  created_at: number;
  email: string;
  name: string | null;
  role: "admin" | "trainer";
  status: "pending" | "active" | "disabled";
}

interface CreateSessionParams {
  id: string;
  userId: string;
  secretHash: Buffer;
  lastVerifiedAt: number;
  createdAt: number;
}

export async function createSessionRecord(
  pool: Pool,
  params: CreateSessionParams,
): Promise<void> {
  await pool.execute(
    `INSERT INTO user_sessions (id, user_id, secret_hash, last_verified_at, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [
      params.id,
      params.userId,
      params.secretHash,
      params.lastVerifiedAt,
      params.createdAt,
    ],
  );
}

export async function getSessionWithUser(
  pool: Pool,
  sessionId: string,
): Promise<SessionRow | null> {
  const [rows] = await pool.execute<SessionRow[]>(
    `SELECT s.id, s.user_id, s.secret_hash, s.last_verified_at, s.created_at,
            u.email, u.name, u.role, u.status
     FROM user_sessions s
     JOIN authorized_users u ON s.user_id = u.id
     WHERE s.id = ?`,
    [sessionId],
  );
  return rows[0] ?? null;
}

export async function updateSessionLastVerified(
  pool: Pool,
  sessionId: string,
  timestamp: number,
): Promise<void> {
  await pool.execute(
    "UPDATE user_sessions SET last_verified_at = ? WHERE id = ?",
    [timestamp, sessionId],
  );
}

export async function deleteSessionRecord(
  pool: Pool,
  sessionId: string,
): Promise<void> {
  await pool.execute("DELETE FROM user_sessions WHERE id = ?", [sessionId]);
}

// ── User queries ──

interface UserRow extends RowDataPacket {
  id: string;
  email: string;
  name: string | null;
  password_hash: string | null;
  role: "admin" | "trainer";
  status: "pending" | "active" | "disabled";
}

export async function getUserByEmail(
  pool: Pool,
  email: string,
): Promise<UserRow | null> {
  const [rows] = await pool.execute<UserRow[]>(
    "SELECT id, email, name, password_hash, role, status FROM authorized_users WHERE email = ?",
    [email],
  );
  return rows[0] ?? null;
}

export async function updateLastLoginAt(
  pool: Pool,
  userId: string,
): Promise<void> {
  await pool.execute(
    "UPDATE authorized_users SET last_login_at = NOW() WHERE id = ?",
    [userId],
  );
}

// ── Dashboard stat queries ──

interface CountRow extends RowDataPacket {
  count: number;
}

export async function getTotalSubmissions(
  pool: Pool,
  userId?: string,
): Promise<number> {
  if (userId) {
    const [rows] = await pool.execute<CountRow[]>(
      `SELECT COUNT(*) as count FROM assessment_answers
       WHERE cq1 IN (SELECT code FROM course_codes WHERE created_by = ?)`,
      [userId],
    );
    return rows[0].count;
  }
  const [rows] = await pool.execute<CountRow[]>(
    "SELECT COUNT(*) as count FROM assessment_answers",
  );
  return rows[0].count;
}

export async function getMonthlySubmissions(
  pool: Pool,
  userId?: string,
): Promise<number> {
  if (userId) {
    const [rows] = await pool.execute<CountRow[]>(
      `SELECT COUNT(*) as count FROM assessment_answers
       WHERE submission_date >= DATE_FORMAT(NOW(), '%Y-%m-01')
         AND cq1 IN (SELECT code FROM course_codes WHERE created_by = ?)`,
      [userId],
    );
    return rows[0].count;
  }
  const [rows] = await pool.execute<CountRow[]>(
    `SELECT COUNT(*) as count FROM assessment_answers
     WHERE submission_date >= DATE_FORMAT(NOW(), '%Y-%m-01')`,
  );
  return rows[0].count;
}

export async function getUniqueCourseCodeCount(
  pool: Pool,
  userId?: string,
): Promise<number> {
  if (userId) {
    const [rows] = await pool.execute<CountRow[]>(
      "SELECT COUNT(*) as count FROM course_codes WHERE created_by = ?",
      [userId],
    );
    return rows[0].count;
  }
  const [rows] = await pool.execute<CountRow[]>(
    "SELECT COUNT(DISTINCT cq1) as count FROM assessment_answers WHERE cq1 IS NOT NULL AND cq1 != ''",
  );
  return rows[0].count;
}

export interface SubmissionRow extends RowDataPacket {
  id: number;
  cq1: string | null;
  submission_date: string;
  fq1: string | null;
  fq2: string | null;
  fq3: string | null;
  aq1: string | null;
  aq2: string | null;
  iq1: string | null;
  rq1: string | null;
  rq2: string | null;
  rq3: string | null;
  rq4: string | null;
}

export async function getRecentSubmissions(
  pool: Pool,
  limit = 10,
  userId?: string,
): Promise<SubmissionRow[]> {
  if (userId) {
    const [rows] = await pool.execute<SubmissionRow[]>(
      `SELECT id, cq1, submission_date, fq1, fq2, fq3, aq1, aq2, iq1, rq1, rq2, rq3, rq4
       FROM assessment_answers
       WHERE cq1 IN (SELECT code FROM course_codes WHERE created_by = ?)
       ORDER BY submission_date DESC
       LIMIT ?`,
      [userId, String(limit)],
    );
    return rows;
  }
  const [rows] = await pool.execute<SubmissionRow[]>(
    `SELECT id, cq1, submission_date, fq1, fq2, fq3, aq1, aq2, iq1, rq1, rq2, rq3, rq4
     FROM assessment_answers
     ORDER BY submission_date DESC
     LIMIT ?`,
    [String(limit)],
  );
  return rows;
}

// ── Single assessment detail query ──

export interface AssessmentDetailRow extends RowDataPacket {
  id: number;
  host: string;
  submission_date: string;
  cq1: string | null;
  yq1: string | null;
  yq2: string | null;
  yq3: string | null;
  fq1: string | null;
  fq1i: string | null;
  fq2: string | null;
  fq2i: string | null;
  fq3: string | null;
  fq3i: string | null;
  aq1: string | null;
  aq1i: string | null;
  aq2: string | null;
  aq2i: string | null;
  iq1: string | null;
  iq1i: string | null;
  rq1: string | null;
  rq1i: string | null;
  rq2: string | null;
  rq2i: string | null;
  rq3: string | null;
  rq3i: string | null;
  rq4: string | null;
  rq4i: string | null;
  qq1: string | null;
  qq2: string | null;
  qq3: string | null;
  qq4: string | null;
}

export async function getSubmissionById(
  pool: Pool,
  id: number,
): Promise<AssessmentDetailRow | null> {
  const [rows] = await pool.execute<AssessmentDetailRow[]>(
    `SELECT ${ASSESSMENT_DETAIL_COLUMNS}
     FROM assessment_answers
     WHERE id = ?`,
    [String(id)],
  );
  return rows[0] ?? null;
}

// ── Course code queries ──

interface CourseCodeRow extends RowDataPacket {
  id: number;
  code: string;
  created_by: string;
  created_at: string;
  submission_count: number;
  avg_fair_score: number | null;
  creator_name: string | null;
  creator_email: string;
}

export interface CourseCodeDetailRow extends RowDataPacket {
  id: number;
  code: string;
  created_by: string;
  created_at: string;
  creator_name: string | null;
  creator_email: string;
}

interface CourseCodeStatsRow extends RowDataPacket {
  total: number;
  avg_score: number | null;
  low_count: number;
  moderate_count: number;
  high_count: number;
}

export interface QuestionStats {
  question: string;
  label: string;
  yes: number;
  yesAvgLikelihood: number | null;
  no: number;
  noAvgLikelihood: number | null;
}

export async function getAllCourseCodes(
  pool: Pool,
  userId?: string,
): Promise<CourseCodeRow[]> {
  const whereClause = userId ? "WHERE cc.created_by = ?" : "";
  const params = userId ? [userId] : [];
  const [rows] = await pool.execute<CourseCodeRow[]>(
    `SELECT
       cc.id,
       cc.code,
       cc.created_by,
       cc.created_at,
       COALESCE(stats.submission_count, 0) AS submission_count,
       stats.avg_fair_score,
       u.name AS creator_name,
       u.email AS creator_email
     FROM course_codes cc
     JOIN authorized_users u ON cc.created_by = u.id
     LEFT JOIN (
       SELECT
         cq1,
         COUNT(*) AS submission_count,
         AVG(${FAIR_SCORE_SQL}) AS avg_fair_score
       FROM assessment_answers
       WHERE cq1 IS NOT NULL AND cq1 != ''
       GROUP BY cq1
     ) stats ON stats.cq1 = cc.code
     ${whereClause}
     ORDER BY cc.created_at DESC`,
    params,
  );
  return rows;
}

export async function getCourseCodeByCode(
  pool: Pool,
  code: string,
): Promise<CourseCodeDetailRow | null> {
  const [rows] = await pool.execute<CourseCodeDetailRow[]>(
    `SELECT cc.id, cc.code, cc.created_by, cc.created_at,
            u.name AS creator_name, u.email AS creator_email
     FROM course_codes cc
     JOIN authorized_users u ON cc.created_by = u.id
     WHERE cc.code = ?`,
    [code],
  );
  return rows[0] ?? null;
}

export async function createCourseCode(
  pool: Pool,
  code: string,
  createdBy: string,
): Promise<number> {
  const [result] = await pool.execute<ResultSetHeader>(
    "INSERT INTO course_codes (code, created_by) VALUES (?, ?)",
    [code, createdBy],
  );
  return result.insertId;
}

interface HostRow extends RowDataPacket {
  host: string;
}

export async function getHostsByCourseCode(
  pool: Pool,
  code: string,
): Promise<string[]> {
  const [rows] = await pool.execute<HostRow[]>(
    `SELECT DISTINCT host FROM assessment_answers WHERE cq1 = ? ORDER BY host`,
    [code],
  );
  return rows.map((r) => r.host);
}

export async function getSubmissionsByCourseCode(
  pool: Pool,
  code: string,
  page: number,
  pageSize: number,
): Promise<SubmissionRow[]> {
  const offset = (page - 1) * pageSize;
  const [rows] = await pool.execute<SubmissionRow[]>(
    `SELECT id, cq1, submission_date, fq1, fq2, fq3, aq1, aq2, iq1, rq1, rq2, rq3, rq4
     FROM assessment_answers
     WHERE cq1 = ?
     ORDER BY submission_date DESC
     LIMIT ? OFFSET ?`,
    [code, String(pageSize), String(offset)],
  );
  return rows;
}

export async function getSubmissionsForDownload(
  pool: Pool,
  code: string,
): Promise<AssessmentDetailRow[]> {
  const [rows] = await pool.execute<AssessmentDetailRow[]>(
    `SELECT ${ASSESSMENT_DETAIL_COLUMNS}
     FROM assessment_answers
     WHERE cq1 = ?
     ORDER BY submission_date DESC`,
    [code],
  );
  return rows;
}

export async function getAllSubmissionsForDownload(
  pool: Pool,
  userId?: string,
): Promise<AssessmentDetailRow[]> {
  const whereClause = userId
    ? "WHERE cq1 IN (SELECT code FROM course_codes WHERE created_by = ?)"
    : "";
  const params = userId ? [userId] : [];
  const [rows] = await pool.execute<AssessmentDetailRow[]>(
    `SELECT ${ASSESSMENT_DETAIL_COLUMNS}
     FROM assessment_answers
     ${whereClause}
     ORDER BY submission_date DESC`,
    params,
  );
  return rows;
}

export async function getSubmissionCountByCourseCode(
  pool: Pool,
  code: string,
): Promise<number> {
  const [rows] = await pool.execute<CountRow[]>(
    "SELECT COUNT(*) as count FROM assessment_answers WHERE cq1 = ?",
    [code],
  );
  return rows[0].count;
}

export async function getCourseCodeStats(
  pool: Pool,
  code: string,
): Promise<{
  total: number;
  avgScore: number | null;
  low: number;
  moderate: number;
  high: number;
}> {
  const [rows] = await pool.execute<CourseCodeStatsRow[]>(
    `SELECT
       COUNT(*) AS total,
       AVG(${FAIR_SCORE_SQL}) AS avg_score,
       SUM(CASE WHEN (${FAIR_SCORE_SQL}) < 6 THEN 1 ELSE 0 END) AS low_count,
       SUM(CASE WHEN (${FAIR_SCORE_SQL}) BETWEEN 6 AND 7 THEN 1 ELSE 0 END) AS moderate_count,
       SUM(CASE WHEN (${FAIR_SCORE_SQL}) >= 8 THEN 1 ELSE 0 END) AS high_count
     FROM assessment_answers
     WHERE cq1 = ?`,
    [code],
  );
  const row = rows[0];
  return {
    total: row.total ?? 0,
    avgScore: row.avg_score,
    low: row.low_count ?? 0,
    moderate: row.moderate_count ?? 0,
    high: row.high_count ?? 0,
  };
}

export async function getCourseCodeQuestionBreakdown(
  pool: Pool,
  code: string,
): Promise<QuestionStats[]> {
  // Build a single query that counts yes/no/other for all 10 FAIR fields
  const selectClauses = FAIR_QUESTIONS.map(
    (q) =>
      `SUM(CASE WHEN LOWER(${q.key}) = 'yes' THEN 1 ELSE 0 END) AS ${q.key}_yes,
       AVG(CASE WHEN LOWER(${q.key}) = 'yes' THEN CAST(${q.key}i AS UNSIGNED) END) AS ${q.key}_yes_avg,
       SUM(CASE WHEN LOWER(${q.key}) = 'no' THEN 1 ELSE 0 END) AS ${q.key}_no,
       AVG(CASE WHEN LOWER(${q.key}) = 'no' THEN CAST(${q.key}i AS UNSIGNED) END) AS ${q.key}_no_avg`,
  ).join(",\n       ");

  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT ${selectClauses}, COUNT(*) AS total
     FROM assessment_answers
     WHERE cq1 = ?`,
    [code],
  );

  const row = rows[0];
  return FAIR_QUESTIONS.map((q) => ({
    question: q.key,
    label: q.label,
    yes: Number(row[`${q.key}_yes`]) || 0,
    yesAvgLikelihood:
      row[`${q.key}_yes_avg`] != null ? Number(row[`${q.key}_yes_avg`]) : null,
    no: Number(row[`${q.key}_no`]) || 0,
    noAvgLikelihood:
      row[`${q.key}_no_avg`] != null ? Number(row[`${q.key}_no_avg`]) : null,
  }));
}

// ── Unaffiliated assessment queries ──

const UNAFFILIATED_WHERE = "(cq1 IS NULL OR cq1 = '')";

export async function getUnaffiliatedCount(pool: Pool): Promise<number> {
  const [rows] = await pool.execute<CountRow[]>(
    `SELECT COUNT(*) as count FROM assessment_answers WHERE ${UNAFFILIATED_WHERE}`,
  );
  return rows[0].count;
}

export async function getUnaffiliatedStats(pool: Pool): Promise<{
  total: number;
  avgScore: number | null;
  low: number;
  moderate: number;
  high: number;
}> {
  const [rows] = await pool.execute<CourseCodeStatsRow[]>(
    `SELECT
       COUNT(*) AS total,
       AVG(${FAIR_SCORE_SQL}) AS avg_score,
       SUM(CASE WHEN (${FAIR_SCORE_SQL}) < 6 THEN 1 ELSE 0 END) AS low_count,
       SUM(CASE WHEN (${FAIR_SCORE_SQL}) BETWEEN 6 AND 7 THEN 1 ELSE 0 END) AS moderate_count,
       SUM(CASE WHEN (${FAIR_SCORE_SQL}) >= 8 THEN 1 ELSE 0 END) AS high_count
     FROM assessment_answers
     WHERE ${UNAFFILIATED_WHERE}`,
  );
  const row = rows[0];
  return {
    total: row.total ?? 0,
    avgScore: row.avg_score,
    low: row.low_count ?? 0,
    moderate: row.moderate_count ?? 0,
    high: row.high_count ?? 0,
  };
}

export async function getUnaffiliatedQuestionBreakdown(
  pool: Pool,
): Promise<QuestionStats[]> {
  const selectClauses = FAIR_QUESTIONS.map(
    (q) =>
      `SUM(CASE WHEN LOWER(${q.key}) = 'yes' THEN 1 ELSE 0 END) AS ${q.key}_yes,
       AVG(CASE WHEN LOWER(${q.key}) = 'yes' THEN CAST(${q.key}i AS UNSIGNED) END) AS ${q.key}_yes_avg,
       SUM(CASE WHEN LOWER(${q.key}) = 'no' THEN 1 ELSE 0 END) AS ${q.key}_no,
       AVG(CASE WHEN LOWER(${q.key}) = 'no' THEN CAST(${q.key}i AS UNSIGNED) END) AS ${q.key}_no_avg`,
  ).join(",\n       ");

  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT ${selectClauses}, COUNT(*) AS total
     FROM assessment_answers
     WHERE ${UNAFFILIATED_WHERE}`,
  );

  const row = rows[0];
  return FAIR_QUESTIONS.map((q) => ({
    question: q.key,
    label: q.label,
    yes: Number(row[`${q.key}_yes`]) || 0,
    yesAvgLikelihood:
      row[`${q.key}_yes_avg`] != null ? Number(row[`${q.key}_yes_avg`]) : null,
    no: Number(row[`${q.key}_no`]) || 0,
    noAvgLikelihood:
      row[`${q.key}_no_avg`] != null ? Number(row[`${q.key}_no_avg`]) : null,
  }));
}

export async function getUnaffiliatedSubmissions(
  pool: Pool,
  page: number,
  pageSize: number,
): Promise<SubmissionRow[]> {
  const offset = (page - 1) * pageSize;
  const [rows] = await pool.execute<SubmissionRow[]>(
    `SELECT id, cq1, submission_date, fq1, fq2, fq3, aq1, aq2, iq1, rq1, rq2, rq3, rq4
     FROM assessment_answers
     WHERE ${UNAFFILIATED_WHERE}
     ORDER BY submission_date DESC
     LIMIT ? OFFSET ?`,
    [String(pageSize), String(offset)],
  );
  return rows;
}

export async function getUnaffiliatedSubmissionCount(
  pool: Pool,
): Promise<number> {
  const [rows] = await pool.execute<CountRow[]>(
    `SELECT COUNT(*) as count FROM assessment_answers WHERE ${UNAFFILIATED_WHERE}`,
  );
  return rows[0].count;
}

export async function getUnaffiliatedHosts(pool: Pool): Promise<string[]> {
  const [rows] = await pool.execute<HostRow[]>(
    `SELECT DISTINCT host FROM assessment_answers WHERE ${UNAFFILIATED_WHERE} ORDER BY host`,
  );
  return rows.map((r) => r.host);
}

export async function getUnaffiliatedSubmissionsForDownload(
  pool: Pool,
): Promise<AssessmentDetailRow[]> {
  const [rows] = await pool.execute<AssessmentDetailRow[]>(
    `SELECT ${ASSESSMENT_DETAIL_COLUMNS}
     FROM assessment_answers
     WHERE ${UNAFFILIATED_WHERE}
     ORDER BY submission_date DESC`,
  );
  return rows;
}

// ── Ownership check ──

export async function isOwnedCourseCode(
  pool: Pool,
  code: string,
  userId: string,
): Promise<boolean> {
  const [rows] = await pool.execute<CountRow[]>(
    "SELECT COUNT(*) as count FROM course_codes WHERE code = ? AND created_by = ?",
    [code, userId],
  );
  return rows[0].count > 0;
}

// ── User management types ──

const INACTIVITY_TIMEOUT_SECONDS = 60 * 60 * 24 * 10; // 10 days

export interface UserListRow extends RowDataPacket {
  id: string;
  email: string;
  name: string | null;
  role: "admin" | "trainer";
  status: "pending" | "active" | "disabled";
  last_login_at: string | null;
  created_at: string;
  has_active_session: number;
}

export interface UserDetailRow extends RowDataPacket {
  id: string;
  email: string;
  name: string | null;
  role: "admin" | "trainer";
  status: "pending" | "active" | "disabled";
  last_login_at: string | null;
  created_at: string;
}

export interface UserCourseCodeRow extends RowDataPacket {
  code: string;
  created_at: string;
  submission_count: number;
}

// ── User management queries ──

export async function getAllUsers(pool: Pool): Promise<UserListRow[]> {
  const [rows] = await pool.execute<UserListRow[]>(
    `SELECT
       u.id, u.email, u.name, u.role, u.status, u.last_login_at, u.created_at,
       CASE WHEN EXISTS (
         SELECT 1 FROM user_sessions s
         WHERE s.user_id = u.id
           AND s.last_verified_at >= (UNIX_TIMESTAMP() - ?)
       ) THEN 1 ELSE 0 END AS has_active_session
     FROM authorized_users u
     ORDER BY u.created_at DESC`,
    [String(INACTIVITY_TIMEOUT_SECONDS)],
  );
  return rows;
}

export async function getUserById(
  pool: Pool,
  userId: string,
): Promise<UserDetailRow | null> {
  const [rows] = await pool.execute<UserDetailRow[]>(
    "SELECT id, email, name, role, status, last_login_at, created_at FROM authorized_users WHERE id = ?",
    [userId],
  );
  return rows[0] ?? null;
}

export async function getUserCourseCodesWithCounts(
  pool: Pool,
  userId: string,
): Promise<UserCourseCodeRow[]> {
  const [rows] = await pool.execute<UserCourseCodeRow[]>(
    `SELECT
       cc.code, cc.created_at,
       COALESCE(COUNT(aa.id), 0) AS submission_count
     FROM course_codes cc
     LEFT JOIN assessment_answers aa ON aa.cq1 = cc.code
     WHERE cc.created_by = ?
     GROUP BY cc.id, cc.code, cc.created_at
     ORDER BY cc.created_at DESC`,
    [userId],
  );
  return rows;
}

export async function hasActiveSession(
  pool: Pool,
  userId: string,
): Promise<boolean> {
  const [rows] = await pool.execute<CountRow[]>(
    `SELECT COUNT(*) as count FROM user_sessions
     WHERE user_id = ? AND last_verified_at >= (UNIX_TIMESTAMP() - ?)`,
    [userId, String(INACTIVITY_TIMEOUT_SECONDS)],
  );
  return rows[0].count > 0;
}

export async function createUser(
  pool: Pool,
  params: { email: string; name: string; role: "admin" | "trainer" },
): Promise<string> {
  const [idResult] = await pool.execute<RowDataPacket[]>("SELECT UUID() as id");
  const userId = (idResult as Array<{ id: string }>)[0].id;

  await pool.execute(
    `INSERT INTO authorized_users (id, email, name, role, status)
     VALUES (?, ?, ?, ?, 'pending')`,
    [userId, params.email, params.name, params.role],
  );
  return userId;
}

export async function updateUserStatus(
  pool: Pool,
  userId: string,
  status: "active" | "disabled",
): Promise<void> {
  await pool.execute("UPDATE authorized_users SET status = ? WHERE id = ?", [
    status,
    userId,
  ]);
}

export async function deleteUser(pool: Pool, userId: string): Promise<void> {
  await pool.execute("DELETE FROM authorized_users WHERE id = ?", [userId]);
}

export async function deleteUserSessions(
  pool: Pool,
  userId: string,
): Promise<void> {
  await pool.execute("DELETE FROM user_sessions WHERE user_id = ?", [userId]);
}

export async function setUserPassword(
  pool: Pool,
  userId: string,
  passwordHash: string,
): Promise<void> {
  await pool.execute(
    "UPDATE authorized_users SET password_hash = ?, status = 'active' WHERE id = ?",
    [passwordHash, userId],
  );
}

export async function checkEmailExists(
  pool: Pool,
  email: string,
): Promise<boolean> {
  const [rows] = await pool.execute<CountRow[]>(
    "SELECT COUNT(*) as count FROM authorized_users WHERE email = ?",
    [email],
  );
  return rows[0].count > 0;
}

// ── Invitation queries ──

interface InvitationRow extends RowDataPacket {
  id: number;
  user_id: string;
  token_hash: Buffer;
  expires_at: number;
  user_status: "pending" | "active" | "disabled";
}

export async function createInvitation(
  pool: Pool,
  userId: string,
  tokenHash: Buffer,
  expiresAt: number,
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await pool.execute("DELETE FROM user_invitations WHERE user_id = ?", [
    userId,
  ]);
  await pool.execute(
    `INSERT INTO user_invitations (user_id, token_hash, expires_at, created_at)
     VALUES (?, ?, ?, ?)`,
    [userId, tokenHash, expiresAt, now],
  );
}

export async function getInvitationByTokenHash(
  pool: Pool,
  tokenHash: Buffer,
): Promise<InvitationRow | null> {
  const [rows] = await pool.execute<InvitationRow[]>(
    `SELECT i.id, i.user_id, i.token_hash, i.expires_at,
            u.status AS user_status
     FROM user_invitations i
     JOIN authorized_users u ON i.user_id = u.id
     WHERE i.token_hash = ?`,
    [tokenHash],
  );
  return rows[0] ?? null;
}

export async function deleteInvitationsByUserId(
  pool: Pool,
  userId: string,
): Promise<void> {
  await pool.execute("DELETE FROM user_invitations WHERE user_id = ?", [
    userId,
  ]);
}
