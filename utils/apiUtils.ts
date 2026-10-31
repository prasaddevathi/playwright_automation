import { APIRequestContext, APIResponse, request } from '@playwright/test';
import { config } from '../config/environment';
import { Logger } from './logger';
import type { User } from '../types/testData.types';

/**
 * Thin wrapper around APIRequestContext for the calls tests actually need
 * (auth, user CRUD). It exists to centralize base URL/auth-header wiring
 * and JSON error handling in one place instead of every spec repeating
 * `request.newContext()` + manual header/status-code plumbing.
 *
 * Every call is logged as `METHOD path → status (N ms)`. Request and
 * response bodies are never logged: they carry credentials, tokens and
 * personal data.
 */
export class ApiClient {
  private constructor(
    private readonly context: APIRequestContext,
    private readonly log: Logger,
  ) {}

  /** Pass the test's logger (the apiClient fixture does) so calls land in that test's log. */
  static async create(logger: Logger = Logger.create('standalone')): Promise<ApiClient> {
    const log = logger.child('ApiClient');
    const token = await ApiClient.fetchToken(log);
    const context = await request.newContext({
      baseURL: config.apiUrl,
      extraHTTPHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    return new ApiClient(context, log);
  }

  private static async fetchToken(log: Logger): Promise<string> {
    const tokenContext = await request.newContext({ baseURL: config.apiUrl });
    try {
      const response = await ApiClient.send(log, 'POST', '/auth/login', () =>
        tokenContext.post('/auth/login', {
          data: { username: config.username, password: config.password },
        }),
      );
      if (!response.ok()) {
        throw new Error(`Failed to authenticate API client: ${response.status()} ${await response.text()}`);
      }
      const body = (await response.json()) as { token: string };
      return body.token;
    } finally {
      await tokenContext.dispose();
    }
  }

  /** Times one request and logs its outcome; 4xx/5xx are logged as warnings. */
  private static async send(
    log: Logger,
    method: string,
    path: string,
    call: () => Promise<APIResponse>,
  ): Promise<APIResponse> {
    const started = Date.now();
    log.debug(`→ ${method} ${path}`);
    let response: APIResponse;
    try {
      response = await call();
    } catch (error) {
      // Network-level failure (DNS, refused, timeout): no status to report.
      log.error(`${method} ${path} failed after ${Date.now() - started} ms`, error);
      throw error;
    }
    const line = `${method} ${path} → ${response.status()} (${Date.now() - started} ms)`;
    if (response.status() >= 400) {
      log.warn(line);
    } else {
      log.info(line);
    }
    return response;
  }

  async createUser(user: Partial<User>): Promise<User> {
    const response = await ApiClient.send(this.log, 'POST', '/users', () =>
      this.context.post('/users', { data: user }),
    );
    if (!response.ok()) {
      throw new Error(`Failed to create user: ${response.status()} ${await response.text()}`);
    }
    return response.json();
  }

  async getUser(userId: string): Promise<User> {
    const response = await ApiClient.send(this.log, 'GET', `/users/${userId}`, () =>
      this.context.get(`/users/${userId}`),
    );
    if (!response.ok()) {
      throw new Error(`Failed to get user ${userId}: ${response.status()}`);
    }
    return response.json();
  }

  async deleteUser(userId: string): Promise<void> {
    const response = await ApiClient.send(this.log, 'DELETE', `/users/${userId}`, () =>
      this.context.delete(`/users/${userId}`),
    );
    if (!response.ok() && response.status() !== 404) {
      throw new Error(`Failed to delete user ${userId}: ${response.status()}`);
    }
  }

  async dispose(): Promise<void> {
    await this.context.dispose();
  }
}
