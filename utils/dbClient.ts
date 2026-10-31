import sql from 'mssql';
import { Logger } from './logger';

export interface DbConfig {
  server: string;
  database: string;
  user: string;
  password: string;
}

/**
 * Deliberately kept out of pages/ and fixtures/ that UI tests depend on:
 * most engineers running UI/API suites should never need DB credentials or
 * a `mssql` dependency in their path. Only specs that import this file pay
 * that cost.
 *
 * Logs connections (server and database only) and each query's row count
 * and duration. Credentials and query parameter values are never logged,
 * because parameters are usually personal data such as email addresses.
 */
export class DbClient {
  private pool: sql.ConnectionPool | null = null;
  private readonly log: Logger;

  /** Pass the test's `logger` fixture so queries land in that test's log. */
  constructor(
    private readonly dbConfig: DbConfig,
    logger: Logger = Logger.create('standalone'),
  ) {
    this.log = logger.child('DbClient');
  }

  async connect(): Promise<void> {
    const started = Date.now();
    this.pool = await new sql.ConnectionPool({
      ...this.dbConfig,
      options: { encrypt: true, trustServerCertificate: true },
    }).connect();
    this.log.info(`Connected to ${this.dbConfig.server}/${this.dbConfig.database} (${Date.now() - started} ms)`);
  }

  async getUserByEmail(email: string): Promise<Record<string, unknown> | undefined> {
    if (!this.pool) {
      throw new Error('DbClient is not connected. Call connect() first.');
    }
    const started = Date.now();
    const result = await this.pool
      .request()
      .input('email', sql.NVarChar, email)
      .query('SELECT TOP 1 * FROM Users WHERE Email = @email');
    this.log.info(`Query Users by email → ${result.recordset.length} row(s) (${Date.now() - started} ms)`);
    return result.recordset[0];
  }

  async close(): Promise<void> {
    await this.pool?.close();
    this.pool = null;
    this.log.debug('Connection closed');
  }
}
