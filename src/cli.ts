import mysql from "mysql2/promise";
import { hashPassword } from "./admin/auth/password.js";
import "dotenv/config";

interface IdRow extends mysql.RowDataPacket {
  id: string;
}

interface CountRow extends mysql.RowDataPacket {
  count: number;
}

function createPool(): mysql.Pool {
  return mysql.createPool({
    host: process.env.MYSQL_DATABASE_HOST || "localhost",
    user: process.env.MYSQL_DATABASE_USER || "fairuser",
    password: process.env.MYSQL_DATABASE_PASSWORD || "fairpassword",
    database: process.env.MYSQL_DATABASE_NAME || "fair_aware",
    port: Number(process.env.MYSQL_DATABASE_PORT) || 3306,
    connectionLimit: 1,
  });
}

function parseArgs(args: string[]): Record<string, string> {
  const parsed: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--") && i + 1 < args.length) {
      parsed[arg.slice(2)] = args[i + 1];
      i++;
    }
  }
  return parsed;
}

async function createAdmin(email: string, password: string): Promise<void> {
  if (!email || !email.includes("@")) {
    console.error("Error: Valid email address is required");
    process.exit(1);
  }

  if (!password || password.length < 8) {
    console.error("Error: Password must be at least 8 characters");
    process.exit(1);
  }

  const pool = createPool();

  try {
    const [existing] = await pool.execute<CountRow[]>(
      "SELECT COUNT(*) as count FROM authorized_users WHERE email = ?",
      [email],
    );

    if (existing[0].count > 0) {
      console.error(`Error: User with email "${email}" already exists`);
      process.exit(1);
    }

    const [idResult] = await pool.execute<IdRow[]>("SELECT UUID() as id");
    const userId = idResult[0].id;
    const passwordHash = await hashPassword(password);

    await pool.execute(
      `INSERT INTO authorized_users (id, email, name, password_hash, role, status)
       VALUES (?, ?, ?, ?, 'admin', 'active')`,
      [userId, email, "Admin", passwordHash],
    );

    console.log(`Admin user created: ${email}`);
  } finally {
    await pool.end();
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log("Usage: node dist/cli.js <command> [options]");
    console.log("");
    console.log("Commands:");
    console.log("  create-admin    Create an admin user");
    console.log("");
    console.log("Options:");
    console.log("  --email         Email address for the admin");
    console.log("  --password      Password for the admin");
    process.exit(0);
  }

  if (command === "create-admin") {
    const flags = parseArgs(args.slice(1));
    if (!flags.email || !flags.password) {
      console.error(
        "Usage: node dist/cli.js create-admin --email <email> --password <password>",
      );
      process.exit(1);
    }
    await createAdmin(flags.email, flags.password);
  } else {
    console.error(`Unknown command: ${command}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
