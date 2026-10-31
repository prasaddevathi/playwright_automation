import { Locator, Page } from '@playwright/test';
import type { Logger } from '../utils/logger';
import { loggedStep } from '../utils/step';

export class NavigationComponent {
  private readonly log: Logger;
  readonly root: Locator;

  constructor(page: Page, logger: Logger) {
    this.log = logger.child('NavigationComponent');
    this.root = page.getByRole('navigation', { name: 'Main' });
  }

  async goToUsers(): Promise<void> {
    await loggedStep(this.log, 'Navigate to Users', async () => {
      await this.root.getByRole('link', { name: 'Users' }).click();
    });
  }

  async goToDashboard(): Promise<void> {
    await loggedStep(this.log, 'Navigate to Dashboard', async () => {
      await this.root.getByRole('link', { name: 'Dashboard' }).click();
    });
  }
}
