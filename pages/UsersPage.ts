import { Locator, Page } from '@playwright/test';
import type { Logger } from '../utils/logger';
import { BasePage } from './BasePage';

export class UsersPage extends BasePage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly userTable: Locator;
  readonly editUserDialog: Locator;
  readonly editEmailInput: Locator;
  readonly saveButton: Locator;

  constructor(page: Page, logger: Logger) {
    super(page, logger);
    this.page = page;
    this.searchInput = page.getByRole('searchbox', { name: 'Search users' });
    this.userTable = page.getByRole('table', { name: 'Users' });
    this.editUserDialog = page.getByRole('dialog', { name: 'Edit user' });
    this.editEmailInput = this.editUserDialog.getByLabel('Email');
    this.saveButton = this.editUserDialog.getByRole('button', { name: 'Save' });
  }

  async goto(): Promise<void> {
    await this.step('Open /users', async () => {
      await this.page.goto('/users');
    });
  }

  /**
   * Row-scoped locator pattern: filter the semantic `row` role by its
   * visible text instead of indexing rows by position, so the query stays
   * correct as rows are added, removed, sorted, or paginated.
   */
  private rowFor(userName: string): Locator {
    return this.userTable.getByRole('row').filter({ hasText: userName });
  }

  async searchUser(name: string): Promise<void> {
    await this.step(`Search users for "${name}"`, async () => {
      await this.searchInput.fill(name);
      await this.searchInput.press('Enter');
    });
  }

  async editUser(userName: string): Promise<void> {
    await this.step(`Open edit dialog for "${userName}"`, async () => {
      await this.rowFor(userName).getByRole('button', { name: 'Edit' }).click();
    });
  }

  async updateEmail(email: string): Promise<void> {
    // The new address itself is personal data, so only the action is logged.
    await this.step('Update email and save', async () => {
      await this.editEmailInput.fill(email);
      await this.saveButton.click();
    });
  }

  async isUserListed(userName: string): Promise<boolean> {
    const listed = await this.rowFor(userName).isVisible();
    this.log.debug(`User "${userName}" listed: ${listed}`);
    return listed;
  }

  rowEmailCell(userName: string): Locator {
    return this.rowFor(userName).getByRole('cell').nth(2);
  }
}
