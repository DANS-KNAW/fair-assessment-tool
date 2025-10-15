import mysql from "mysql2/promise";
import type {
  Pool,
  PoolOptions,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";
import type {
  AssessmentAnswerDto,
  CompleteAnswerDto,
} from "../types/assessment-answers.js";

export class DatabaseHandler {
  private pool: Pool;

  constructor(config: PoolOptions) {
    this.pool = mysql.createPool({
      ...config,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });
  }

  /**
   * Gracefully closes the connection pool
   */
  async close(): Promise<void> {
    await this.pool.end();
  }

  /**
   * Insert a new assessment answer
   * @returns The auto-generated ID of the inserted record
   */
  async setAnswer(answers: AssessmentAnswerDto, host: string): Promise<number> {
    const query = `
      INSERT INTO assessment_answers (
        host, submission_date, cq1, yq1, yq2, yq3,
        fq1, fq1i, fq2, fq2i, fq3, fq3i,
        aq1, aq1i, aq2, aq2i,
        iq1, iq1i,
        rq1, rq1i, rq2, rq2i, rq3, rq3i, rq4, rq4i,
        qq1, qq2, qq3, qq4
      ) VALUES (?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      host,
      answers.cq1,
      answers.yq1,
      answers.yq2,
      answers.yq3,
      answers.fq1,
      answers.fq1i,
      answers.fq2,
      answers.fq2i,
      answers.fq3,
      answers.fq3i,
      answers.aq1,
      answers.aq1i,
      answers.aq2,
      answers.aq2i,
      answers.iq1,
      answers.iq1i,
      answers.rq1,
      answers.rq1i,
      answers.rq2,
      answers.rq2i,
      answers.rq3,
      answers.rq3i,
      answers.rq4,
      answers.rq4i,
      answers.qq1,
      answers.qq2,
      answers.qq3,
      answers.qq4,
    ];

    try {
      const [result] = await this.pool.execute<ResultSetHeader>(query, values);
      return result.insertId;
    } catch (error) {
      console.error("Database error in setAnswer:", error);
      throw new Error("Failed to save assessment answer");
    }
  }

  /**
   * Get assessment answers filtered by code
   * @param code - specific code or "downloadall" for all records
   * @param host - optional host filter
   */
  async getAnswers(
    code: string | "downloadall",
    host?: string
  ): Promise<CompleteAnswerDto[]> {
    let query = `
      SELECT 
        host, 
        submission_date as date, 
        cq1, yq1, yq2, yq3,
        fq1, fq1i, fq2, fq2i, fq3, fq3i,
        aq1, aq1i, aq2, aq2i,
        iq1, iq1i,
        rq1, rq1i, rq2, rq2i, rq3, rq3i, rq4, rq4i,
        qq1, qq2, qq3, qq4
      FROM assessment_answers
      WHERE 1=1
    `;

    const values: string[] = [];

    if (host) {
      query += " AND host = ?";
      values.push(host);
    }

    if (code !== "downloadall" && code !== "") {
      query += " AND cq1 = ?";
      values.push(code);
    }

    query += " ORDER BY submission_date DESC";

    try {
      const [rows] = await this.pool.execute<RowDataPacket[]>(query, values);
      return rows.map((row: RowDataPacket) => ({
        host: row.host || "",
        date: row.date || "",
        cq1: row.cq1 || "",
        yq1: row.yq1 || "",
        yq2: row.yq2 || "",
        yq3: row.yq3 || "",
        fq1: row.fq1 || "",
        fq1i: row.fq1i || "",
        fq2: row.fq2 || "",
        fq2i: row.fq2i || "",
        fq3: row.fq3 || "",
        fq3i: row.fq3i || "",
        aq1: row.aq1 || "",
        aq1i: row.aq1i || "",
        aq2: row.aq2 || "",
        aq2i: row.aq2i || "",
        iq1: row.iq1 || "",
        iq1i: row.iq1i || "",
        rq1: row.rq1 || "",
        rq1i: row.rq1i || "",
        rq2: row.rq2 || "",
        rq2i: row.rq2i || "",
        rq3: row.rq3 || "",
        rq3i: row.rq3i || "",
        rq4: row.rq4 || "",
        rq4i: row.rq4i || "",
        qq1: row.qq1 || "",
        qq2: row.qq2 || "",
        qq3: row.qq3 || "",
        qq4: row.qq4 || "",
      }));
    } catch (error) {
      console.error("Database error in getAnswers:", error);
      throw new Error("Failed to fetch assessment answers");
    }
  }

  /**
   * Validate user credentials
   * @param email - User email
   * @param password - User password
   * @returns True if the user is valid, false otherwise
   */
  async validateUser(email: string, password: string): Promise<boolean> {
    const query = `
      SELECT COUNT(*) as count
      FROM authorized_users
      WHERE email = ? AND access_token = ?
    `;

    try {
      const [rows] = await this.pool.execute<RowDataPacket[]>(query, [
        email,
        password,
      ]);
      const count = rows[0]?.count || 0;

      if (count > 1) {
        console.error("Multiple users found with the same email/password"); // This should not happen
        throw new Error("Data integrity issue");
      }

      return count > 0;
    } catch (error) {
      console.error("Database error in validateUser:", error);
      throw new Error("Failed to validate user");
    }
  }
}
