import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  readonly welcomeHeading: Locator;

  constructor(page: Page) {
    super(page);
    this.welcomeHeading = page.getByRole('heading', { name: /welcome/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/dashboard');
  }
}
