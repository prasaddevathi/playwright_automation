import { Locator, Page } from '@playwright/test';

export class NavigationComponent {
  readonly root: Locator;

  constructor(page: Page) {
    this.root = page.getByRole('navigation', { name: 'Main' });
  }

  async goToUsers(): Promise<void> {
    await this.root.getByRole('link', { name: 'Users' }).click();
  }

  async goToDashboard(): Promise<void> {
    await this.root.getByRole('link', { name: 'Dashboard' }).click();
  }
}
