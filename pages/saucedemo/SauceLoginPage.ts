import { Locator, Page } from '@playwright/test';
import type { Logger } from '../../utils/logger';
import { SauceBasePage } from './SauceBasePage';

export class SauceLoginPage extends SauceBasePage {
  protected readonly path = '/';
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page, logger: Logger) {
    super(page, logger);
    this.usernameInput = page.getByPlaceholder('Username');
    this.passwordInput = page.getByPlaceholder('Password');
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.errorMessage = page.getByTestId('error');
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
