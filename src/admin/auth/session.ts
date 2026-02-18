import type { Context } from "hono";
import { deleteCookie, setCookie } from "hono/cookie";
import type { Pool } from "mysql2/promise";
import {
  createSessionRecord,
  deleteSessionRecord,
  getSessionWithUser,
  updateSessionLastVerified,
} from "../db/queries.js";
import type { AdminEnv, SessionValidationResult } from "../types.js";

const SESSION_COOKIE = "admin_session";
const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";
const ID_LENGTH = 24;
const INACTIVITY_TIMEOUT = 60 * 60 * 24 * 10; // 10 days in seconds
const ACTIVITY_CHECK_INTERVAL = 60 * 60; // 1 hour in seconds

export function generateSecureRandomString(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let result = "";
  for (let i = 0; i < length; i++) {
    result += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return result;
}

export async function hashSecret(secret: string): Promise<Uint8Array> {
  const encoded = new TextEncoder().encode(secret);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return new Uint8Array(digest);
}

export function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}

export async function createSession(
  pool: Pool,
  userId: string,
): Promise<string> {
  const sessionId = generateSecureRandomString(ID_LENGTH);
  const sessionSecret = generateSecureRandomString(ID_LENGTH);
  const secretHash = await hashSecret(sessionSecret);
  const now = Math.floor(Date.now() / 1000);

  await createSessionRecord(pool, {
    id: sessionId,
    userId,
    secretHash: Buffer.from(secretHash),
    lastVerifiedAt: now,
    createdAt: now,
  });

  return `${sessionId}.${sessionSecret}`;
}

export async function validateSessionToken(
  pool: Pool,
  token: string,
): Promise<SessionValidationResult | null> {
  const dotIndex = token.indexOf(".");
  if (dotIndex === -1) return null;

  const sessionId = token.substring(0, dotIndex);
  const sessionSecret = token.substring(dotIndex + 1);

  if (sessionId.length !== ID_LENGTH || sessionSecret.length !== ID_LENGTH) {
    return null;
  }

  const row = await getSessionWithUser(pool, sessionId);
  if (!row) return null;

  const expectedHash = new Uint8Array(row.secret_hash);
  const providedHash = await hashSecret(sessionSecret);

  if (!constantTimeEqual(expectedHash, providedHash)) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);

  // Check inactivity timeout
  if (now - row.last_verified_at >= INACTIVITY_TIMEOUT) {
    await deleteSessionRecord(pool, sessionId);
    return null;
  }

  // Update last_verified_at if stale (>1 hour since last check)
  if (now - row.last_verified_at >= ACTIVITY_CHECK_INTERVAL) {
    await updateSessionLastVerified(pool, sessionId, now);
  }

  return {
    session: {
      id: sessionId,
      userId: row.user_id,
      lastVerifiedAt: row.last_verified_at,
      createdAt: row.created_at,
    },
    user: {
      id: row.user_id,
      email: row.email,
      name: row.name,
      role: row.role,
      status: row.status,
    },
  };
}

export async function invalidateSession(
  pool: Pool,
  sessionId: string,
): Promise<void> {
  await deleteSessionRecord(pool, sessionId);
}

export function setSessionCookie(c: Context<AdminEnv>, token: string): void {
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    path: "/admin",
    maxAge: INACTIVITY_TIMEOUT,
  });
}

export function deleteSessionCookie(c: Context<AdminEnv>): void {
  deleteCookie(c, SESSION_COOKIE, {
    path: "/admin",
  });
}
