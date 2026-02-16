import type { Pool } from "mysql2/promise";

export interface AdminUser {
  id: number;
  email: string;
  name: string | null;
  role: "admin" | "trainer";
}

export interface Session {
  id: string;
  userId: number;
  lastVerifiedAt: number;
  createdAt: number;
}

export interface SessionValidationResult {
  session: Session;
  user: AdminUser;
}

export type AdminEnv = {
  Bindings: {
    pool: Pool;
  };
  Variables: {
    user: AdminUser;
    session: Session;
  };
};
