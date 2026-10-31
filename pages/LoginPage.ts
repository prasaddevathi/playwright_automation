import { Locator, Page } from '@playwright/test';
import type { Logger } from '../utils/logger';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly loginErrorMessage: Locator;

  constructor(page: Page, logger: Logger) {
    super(page, logger);
    this.usernameInput = page.getByLabel('Username');
    this.passwordInput = page.getByLabel('Password');
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.loginErrorMessage = page.getByRole('alert');
  }

  async goto(): Promise<void> {
    await this.step('Open /login', async () => {
      await this.page.goto('/login');
    });
  }

  async login(username: string, password: string): Promise<void> {
    // The password is never logged — only its presence.
    await this.step(`Log in as "${username || '<empty>'}" (password ${password ? 'provided' : 'empty'})`, async () => {
      await this.usernameInput.fill(username);
      await this.passwordInput.fill(password);
      await this.loginButton.click();
    });
  }
}
