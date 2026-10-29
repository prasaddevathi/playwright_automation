import { Locator, Page } from '@playwright/test';

/**
 * The header appears on every authenticated page. Modeling it as a
 * component (not a page) means UsersPage, DashboardPage, etc. can all
 * compose it via a fixture instead of duplicating its locators.
 */
export class HeaderComponent {
  readonly root: Locator;
  readonly userMenuButton: Locator;
  readonly logoutMenuItem: Locator;

  constructor(page: Page) {
    this.root = page.getByRole('banner');
    this.userMenuButton = this.root.getByRole('button', { name: 'Account menu' });
    this.logoutMenuItem = page.getByRole('menuitem', { name: 'Logout' });
  }

  async logout(): Promise<void> {
    await this.userMenuButton.click();
    await this.logoutMenuItem.click();
  }
}
