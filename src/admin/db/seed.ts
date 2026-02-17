import type { Pool, RowDataPacket } from "mysql2/promise";
import { hashPassword } from "../auth/password.js";

interface AdminRow extends RowDataPacket {
  id: string;
  password_hash: string | null;
}

export async function seedDefaultAdmin(pool: Pool): Promise<void> {
  const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD;
  if (!defaultPassword) {
    console.log(
      "[admin] ADMIN_DEFAULT_PASSWORD not set, skipping admin password seed",
    );
    return;
  }

  const [rows] = await pool.execute<AdminRow[]>(
    "SELECT id, password_hash FROM authorized_users WHERE email = ?",
    ["root@fairaware.system.com"],
  );

  const admin = rows[0];
  if (!admin) {
    console.log(
      "[admin] Default admin user not found in database, skipping seed",
    );
    return;
  }

  if (admin.password_hash) {
    console.log(
      "[admin] Default admin already has a password hash, skipping seed",
    );
    return;
  }

  const hash = await hashPassword(defaultPassword);
  await pool.execute(
    "UPDATE authorized_users SET password_hash = ?, role = 'admin' WHERE id = ?",
    [hash, admin.id],
  );

  console.log("[admin] Default admin password hash set successfully");
}
