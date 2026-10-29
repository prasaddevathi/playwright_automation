import { APIRequestContext, request } from '@playwright/test';
import { config } from '../config/environment';
import type { User } from '../types/testData.types';

/**
 * Thin wrapper around APIRequestContext for the calls tests actually need
 * (auth, user CRUD). It exists to centralize base URL/auth-header wiring
 * and JSON error handling in one place instead of every spec repeating
 * `request.newContext()` + manual header/status-code plumbing.
 */
export class ApiClient {
  private constructor(private readonly context: APIRequestContext) {}

  static async create(): Promise<ApiClient> {
    const token = await ApiClient.fetchToken();
    const context = await request.newContext({
      baseURL: config.apiUrl,
      extraHTTPHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    return new ApiClient(context);
  }

  private static async fetchToken(): Promise<string> {
    const tokenContext = await request.newContext({ baseURL: config.apiUrl });
    try {
      const response = await tokenContext.post('/auth/login', {
        data: { username: config.username, password: config.password },
      });
      if (!response.ok()) {
        throw new Error(`Failed to authenticate API client: ${response.status()} ${await response.text()}`);
      }
      const body = (await response.json()) as { token: string };
      return body.token;
    } finally {
      await tokenContext.dispose();
    }
  }

  async createUser(user: Partial<User>): Promise<User> {
    const response = await this.context.post('/users', { data: user });
    if (!response.ok()) {
      throw new Error(`Failed to create user: ${response.status()} ${await response.text()}`);
    }
    return response.json();
  }

  async getUser(userId: string): Promise<User> {
    const response = await this.context.get(`/users/${userId}`);
    if (!response.ok()) {
      throw new Error(`Failed to get user ${userId}: ${response.status()}`);
    }
    return response.json();
  }

  async deleteUser(userId: string): Promise<void> {
    const response = await this.context.delete(`/users/${userId}`);
    if (!response.ok() && response.status() !== 404) {
      throw new Error(`Failed to delete user ${userId}: ${response.status()}`);
    }
  }

  async dispose(): Promise<void> {
    await this.context.dispose();
  }
}
