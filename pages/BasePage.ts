import { Locator, Page } from '@playwright/test';
import type { Logger } from '../utils/logger';
import { loggedStep } from '../utils/step';

/**
 * Holds only behavior that is genuinely shared across pages of THIS
 * application (toast notifications, a global loading spinner, logging). It
 * does not wrap Playwright primitives (click/fill/etc.) — that would just
 * reproduce the Playwright API with no added value and hide real waiting
 * semantics from page classes.
 */
export abstract class BasePage {
  protected readonly page: Page;
  protected readonly log: Logger;
  readonly successToast: Locator;
  readonly errorToast: Locator;

  protected constructor(page: Page, logger: Logger) {
    this.page = page;
    this.log = logger.child(this.constructor.name);
    this.successToast = page.getByRole('status').filter({ hasText: /success/i });
    this.errorToast = page.getByRole('alert');
  }

  async waitUntilReady(): Promise<void> {
    await this.step('Wait until page is ready', async () => {
      await this.page.waitForLoadState('domcontentloaded');
      await this.page
        .locator('[data-testid="global-spinner"]')
        .waitFor({ state: 'hidden' })
        .catch(() => undefined);
    });
  }

  async dismissToastIfPresent(): Promise<void> {
    const closeButton = this.page.getByRole('button', { name: 'Close notification' });
    if (await closeButton.isVisible().catch(() => false)) {
      await this.step('Dismiss notification', () => closeButton.click());
    }
  }

  /** Wraps a page action so it is logged and shown as a step in the report. */
  protected step<T>(name: string, body: () => Promise<T>): Promise<T> {
    return loggedStep(this.log, name, body);
  }
}
