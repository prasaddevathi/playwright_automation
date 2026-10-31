import { Locator, Page } from '@playwright/test';
import type { Logger } from '../utils/logger';
import { loggedStep } from '../utils/step';

/**
 * The header appears on every authenticated page. Modeling it as a
 * component (not a page) means UsersPage, DashboardPage, etc. can all
 * compose it via a fixture instead of duplicating its locators.
 */
export class HeaderComponent {
  private readonly log: Logger;
  readonly root: Locator;
  readonly userMenuButton: Locator;
  readonly logoutMenuItem: Locator;

  constructor(page: Page, logger: Logger) {
    this.log = logger.child('HeaderComponent');
    this.root = page.getByRole('banner');
    this.userMenuButton = this.root.getByRole('button', { name: 'Account menu' });
    this.logoutMenuItem = page.getByRole('menuitem', { name: 'Logout' });
  }

  async logout(): Promise<void> {
    await loggedStep(this.log, 'Log out via account menu', async () => {
      await this.userMenuButton.click();
      await this.logoutMenuItem.click();
    });
  }
}
