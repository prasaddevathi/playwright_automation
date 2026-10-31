import { Locator, Page } from '@playwright/test';
import type { Logger } from '../../utils/logger';
import { loggedStep } from '../../utils/step';

/**
 * Shared behavior for every SauceDemo page: the page title banner, a
 * logger scoped to the concrete page class, and `step()`.
 *
 * `step()` delegates to the framework-wide `loggedStep` (utils/step.ts):
 * each public page action becomes a named, timed node in the HTML report
 * and trace viewer, and is logged with its duration and, on failure, the
 * error. Page classes stay free of try/catch and timing boilerplate.
 */
export abstract class SauceBasePage {
  protected readonly page: Page;
  protected readonly log: Logger;
  readonly title: Locator;

  /** Path relative to baseURL, used by goto() and isOpen checks. */
  protected abstract readonly path: string;

  protected constructor(page: Page, logger: Logger) {
    this.page = page;
    this.log = logger.child(this.constructor.name);
    this.title = page.getByTestId('title');
  }

  async goto(): Promise<void> {
    await this.step(`Open ${this.path}`, async () => {
      // Not waiting for the full `load` event: SauceDemo's large product
      // images can stall it (notably in Firefox), and every assertion after
      // navigation auto-waits for the elements it actually needs.
      await this.page.goto(this.path, { waitUntil: 'domcontentloaded' });
    });
  }

  protected step<T>(name: string, body: () => Promise<T>): Promise<T> {
    return loggedStep(this.log, name, body);
  }
}
