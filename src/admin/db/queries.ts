import type { Pool, RowDataPacket } from "mysql2/promise";

// ── Session queries ──

interface SessionRow extends RowDataPacket {
  id: string;
  user_id: number;
  secret_hash: Buffer;
  last_verified_at: number;
  created_at: number;
  email: string;
  name: string | null;
  role: "admin" | "trainer";
}

interface CreateSessionParams {
  id: string;
  userId: number;
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
            u.email, u.name, u.role
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
  id: number;
  email: string;
  name: string | null;
  password_hash: string | null;
  role: "admin" | "trainer";
}

export async function getUserByEmail(
  pool: Pool,
  email: string,
): Promise<UserRow | null> {
  const [rows] = await pool.execute<UserRow[]>(
    "SELECT id, email, name, password_hash, role FROM authorized_users WHERE email = ?",
    [email],
  );
  return rows[0] ?? null;
}

// ── Dashboard stat queries ──

interface CountRow extends RowDataPacket {
  count: number;
}

export async function getTotalSubmissions(pool: Pool): Promise<number> {
  const [rows] = await pool.execute<CountRow[]>(
    "SELECT COUNT(*) as count FROM assessment_answers",
  );
  return rows[0].count;
}

export async function getMonthlySubmissions(pool: Pool): Promise<number> {
  const [rows] = await pool.execute<CountRow[]>(
    `SELECT COUNT(*) as count FROM assessment_answers
     WHERE submission_date >= DATE_FORMAT(NOW(), '%Y-%m-01')`,
  );
  return rows[0].count;
}

export async function getUniqueCourseCodeCount(pool: Pool): Promise<number> {
  const [rows] = await pool.execute<CountRow[]>(
    "SELECT COUNT(DISTINCT cq1) as count FROM assessment_answers WHERE cq1 IS NOT NULL AND cq1 != ''",
  );
  return rows[0].count;
}

export async function getUniqueDomainCount(pool: Pool): Promise<number> {
  const [rows] = await pool.execute<CountRow[]>(
    "SELECT COUNT(DISTINCT yq1) as count FROM assessment_answers WHERE yq1 IS NOT NULL AND yq1 != ''",
  );
  return rows[0].count;
}

interface RecentSubmissionRow extends RowDataPacket {
  cq1: string | null;
  submission_date: string;
  yq1: string | null;
}

export async function getRecentSubmissions(
  pool: Pool,
  limit = 10,
): Promise<RecentSubmissionRow[]> {
  const [rows] = await pool.execute<RecentSubmissionRow[]>(
    `SELECT cq1, submission_date, yq1
     FROM assessment_answers
     ORDER BY submission_date DESC
     LIMIT ?`,
    [String(limit)],
  );
  return rows;
}
