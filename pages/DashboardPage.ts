import { Locator, Page } from '@playwright/test';
import type { Logger } from '../utils/logger';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  readonly welcomeHeading: Locator;

  constructor(page: Page, logger: Logger) {
    super(page, logger);
    this.welcomeHeading = page.getByRole('heading', { name: /welcome/i });
  }

  async goto(): Promise<void> {
    await this.step('Open /dashboard', async () => {
      await this.page.goto('/dashboard');
    });
  }
}
