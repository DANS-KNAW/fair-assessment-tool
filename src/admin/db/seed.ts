import type { Pool, RowDataPacket } from "mysql2/promise";

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
