import type { Pool, RowDataPacket } from "mysql2/promise";
import { hashPassword } from "../auth/password.js";

interface UserRow extends RowDataPacket {
  id: string;
  password_hash: string | null;
}

interface IdRow extends RowDataPacket {
  id: string;
}

interface ColumnCheckRow extends RowDataPacket {
  count: number;
}

async function columnExists(
  pool: Pool,
  table: string,
  column: string,
): Promise<boolean> {
  const [rows] = await pool.execute<ColumnCheckRow[]>(
    `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column],
  );
  return rows[0].count > 0;
}

export async function runMigrations(pool: Pool): Promise<void> {
  if (!(await columnExists(pool, "authorized_users", "status"))) {
    await pool.execute(`
      ALTER TABLE authorized_users
      ADD COLUMN status ENUM('pending', 'active', 'disabled') NOT NULL DEFAULT 'active'
    `);
  }

  if (!(await columnExists(pool, "authorized_users", "last_login_at"))) {
    await pool.execute(`
      ALTER TABLE authorized_users
      ADD COLUMN last_login_at TIMESTAMP NULL DEFAULT NULL
    `);
  }

  await pool.execute(`
    ALTER TABLE authorized_users
    MODIFY COLUMN access_token VARCHAR(255) DEFAULT NULL
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS user_invitations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id CHAR(36) NOT NULL,
      token_hash VARBINARY(32) NOT NULL,
      expires_at BIGINT NOT NULL,
      created_at BIGINT NOT NULL,
      INDEX idx_user_id (user_id),
      CONSTRAINT fk_invitation_user
        FOREIGN KEY (user_id) REFERENCES authorized_users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  console.log("[admin] Migrations completed");
}

export async function seedDefaultAdmin(pool: Pool): Promise<void> {
  const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD;
  if (!defaultPassword) {
    console.log(
      "[admin] ADMIN_DEFAULT_PASSWORD not set, skipping admin password seed",
    );
    return;
  }

  const [rows] = await pool.execute<UserRow[]>(
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

export async function seedDefaultTrainer(pool: Pool): Promise<void> {
  const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD;
  if (!defaultPassword) {
    console.log(
      "[admin] ADMIN_DEFAULT_PASSWORD not set, skipping trainer seed",
    );
    return;
  }

  const trainerEmail = "trainer@fairaware.test";

  const [rows] = await pool.execute<UserRow[]>(
    "SELECT id, password_hash FROM authorized_users WHERE email = ?",
    [trainerEmail],
  );

  let trainerId: string;

  if (!rows[0]) {
    const [idResult] = await pool.execute<IdRow[]>("SELECT UUID() as id");
    trainerId = idResult[0].id;
    const hash = await hashPassword(defaultPassword);
    await pool.execute(
      `INSERT INTO authorized_users (id, email, name, access_token, password_hash, role)
       VALUES (?, ?, ?, ?, ?, 'trainer')`,
      [
        trainerId,
        trainerEmail,
        "Test Trainer",
        "test_trainer_token_placeholder_not_for_production",
        hash,
      ],
    );
    console.log("[admin] Test trainer account created");
  } else {
    trainerId = rows[0].id;
    if (!rows[0].password_hash) {
      const hash = await hashPassword(defaultPassword);
      await pool.execute(
        "UPDATE authorized_users SET password_hash = ? WHERE id = ?",
        [hash, trainerId],
      );
      console.log("[admin] Test trainer password hash set");
    } else {
      console.log("[admin] Test trainer already has a password hash, skipping");
    }
  }

  // Assign RDM300 course code to this trainer
  const [codeRows] = await pool.execute<IdRow[]>(
    "SELECT id FROM course_codes WHERE code = ?",
    ["RDM300"],
  );

  if (codeRows[0]) {
    await pool.execute(
      "UPDATE course_codes SET created_by = ? WHERE code = ?",
      [trainerId, "RDM300"],
    );
    console.log("[admin] Course code RDM300 assigned to test trainer");
  } else {
    await pool.execute(
      "INSERT INTO course_codes (code, created_by) VALUES (?, ?)",
      ["RDM300", trainerId],
    );
    console.log("[admin] Course code RDM300 created for test trainer");
  }
}
