import type { Pool, PoolOptions, ResultSetHeader } from "mysql2/promise";
import mysql from "mysql2/promise";
import type { AssessmentAnswerDto } from "../types/assessment-answers.js";

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

  getPool(): Pool {
    return this.pool;
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
}
