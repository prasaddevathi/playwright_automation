import sql from 'mssql';

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
 */
export class DbClient {
  private pool: sql.ConnectionPool | null = null;

  constructor(private readonly dbConfig: DbConfig) {}

  async connect(): Promise<void> {
    this.pool = await new sql.ConnectionPool({
      ...this.dbConfig,
      options: { encrypt: true, trustServerCertificate: true },
    }).connect();
  }

  async getUserByEmail(email: string): Promise<Record<string, unknown> | undefined> {
    if (!this.pool) {
      throw new Error('DbClient is not connected. Call connect() first.');
    }
    const result = await this.pool
      .request()
      .input('email', sql.NVarChar, email)
      .query('SELECT TOP 1 * FROM Users WHERE Email = @email');
    return result.recordset[0];
  }

  async close(): Promise<void> {
    await this.pool?.close();
    this.pool = null;
  }
}
