import type { RowDataPacket } from "mysql2/promise";
import mysql from "mysql2/promise";
import { hashPassword } from "../admin/auth/password.js";
import "dotenv/config";

interface CountRow extends RowDataPacket {
  count: number;
}

interface IdRow extends RowDataPacket {
  id: string;
}

const DEV_ADMIN = {
  email: "root@fairaware.system.com",
  name: "System Admin",
  password: "admin123",
  role: "admin" as const,
};

async function main(): Promise<void> {
  const pool = mysql.createPool({
    host: process.env.MYSQL_DATABASE_HOST || "localhost",
    user: process.env.MYSQL_DATABASE_USER || "fairuser",
    password: process.env.MYSQL_DATABASE_PASSWORD || "fairpassword",
    database: process.env.MYSQL_DATABASE_NAME || "fair_aware",
    port: Number(process.env.MYSQL_DATABASE_PORT) || 3306,
    connectionLimit: 1,
  });

  try {
    const [existing] = await pool.execute<CountRow[]>(
      "SELECT COUNT(*) as count FROM authorized_users WHERE email = ?",
      [DEV_ADMIN.email],
    );

    if (existing[0].count > 0) {
      console.log(
        `[dev-seed] Admin "${DEV_ADMIN.email}" already exists, skipping`,
      );
    } else {
      const [idResult] = await pool.execute<IdRow[]>("SELECT UUID() as id");
      const passwordHash = await hashPassword(DEV_ADMIN.password);

      await pool.execute(
        `INSERT INTO authorized_users (id, email, name, password_hash, role, status)
         VALUES (?, ?, ?, ?, ?, 'active')`,
        [
          idResult[0].id,
          DEV_ADMIN.email,
          DEV_ADMIN.name,
          passwordHash,
          DEV_ADMIN.role,
        ],
      );

      console.log(
        `[dev-seed] Admin created: ${DEV_ADMIN.email} (password: ${DEV_ADMIN.password})`,
      );
    }

    console.log("[dev-seed] Done");
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("[dev-seed] Fatal error:", err);
  process.exit(1);
});
