import { Locator, Page, test } from '@playwright/test';
import type { Logger } from '../../utils/logger';

/**
 * Shared behavior for every SauceDemo page: the page title banner, a
 * logger scoped to the concrete page class, and `step()`.
 *
 * `step()` is the one place where logging and reporting meet: each public
 * page action is wrapped in a Playwright `test.step` (so it shows up as a
 * named, timed node in the HTML report and trace viewer) and logged with
 * its duration and, on failure, the error. Page classes stay free of
 * try/catch and timing boilerplate.
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

  protected async step<T>(name: string, body: () => Promise<T>): Promise<T> {
    const started = Date.now();
    this.log.info(`→ ${name}`);
    try {
      const result = await test.step(name, body, { box: true });
      this.log.debug(`✓ ${name} (${Date.now() - started} ms)`);
      return result;
    } catch (error) {
      this.log.error(`✗ ${name} failed after ${Date.now() - started} ms`, error);
      throw error;
    }
  }
}
