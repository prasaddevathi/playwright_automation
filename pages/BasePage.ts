import { Locator, Page } from '@playwright/test';

/**
 * Holds only behavior that is genuinely shared across pages of THIS
 * application (toast notifications, a global loading spinner). It does not
 * wrap Playwright primitives (click/fill/etc.) — that would just reproduce
 * the Playwright API with no added value and hide real waiting semantics
 * from page classes.
 */
export abstract class BasePage {
  protected readonly page: Page;
  readonly successToast: Locator;
  readonly errorToast: Locator;

  protected constructor(page: Page) {
    this.page = page;
    this.successToast = page.getByRole('status').filter({ hasText: /success/i });
    this.errorToast = page.getByRole('alert');
  }

  async waitUntilReady(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page
      .locator('[data-testid="global-spinner"]')
      .waitFor({ state: 'hidden' })
      .catch(() => undefined);
  }

  async dismissToastIfPresent(): Promise<void> {
    const closeButton = this.page.getByRole('button', { name: 'Close notification' });
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click();
    }
  }
}
