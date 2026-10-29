import { test as base } from '@playwright/test';
import { Logger } from '../utils/logger';
import { SauceLoginPage } from '../pages/saucedemo/SauceLoginPage';
import { InventoryPage } from '../pages/saucedemo/InventoryPage';
import { CartPage } from '../pages/saucedemo/CartPage';
import {
  CheckoutCompletePage,
  CheckoutInformationPage,
  CheckoutOverviewPage,
} from '../pages/saucedemo/CheckoutPages';
import { SauceHeaderComponent } from '../components/saucedemo/SauceHeaderComponent';

type SauceFixtures = {
  logger: Logger;
  loginPage: SauceLoginPage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutInfoPage: CheckoutInformationPage;
  checkoutOverviewPage: CheckoutOverviewPage;
  checkoutCompletePage: CheckoutCompletePage;
  header: SauceHeaderComponent;
};

/**
 * `logger` is an auto fixture, so EVERY test is logged, even one that never
 * asks for it:
 *  - test start / end with status, duration and retry number
 *  - browser console errors, uncaught page errors and failed / 4xx-5xx
 *    network requests, which are often the real root cause of a UI failure
 *  - the failure message when a test does not pass
 * At teardown the test's full log is attached to its HTML report entry as
 * `execution-log`, next to the screenshot / video / trace.
 */
export const test = base.extend<SauceFixtures>({
  logger: [
    async ({ page }, use, testInfo) => {
      const logger = Logger.create(testInfo.titlePath.slice(1).join(' › '));
      logger.info(`▶ START (project: ${testInfo.project.name}, retry: ${testInfo.retry})`);

      page.on('console', (msg) => {
        if (msg.type() === 'error') logger.warn(`[browser console] ${msg.text()}`);
      });
      page.on('pageerror', (error) => logger.error('[page error] Uncaught exception in page', error));
      page.on('requestfailed', (request) =>
        logger.warn(`[network] ${request.method()} ${request.url()} failed: ${request.failure()?.errorText}`),
      );
      page.on('response', (response) => {
        if (response.status() >= 400) {
          logger.debug(`[network] ${response.request().method()} ${response.url()} → ${response.status()}`);
        }
      });

      await use(logger);

      const summary = `■ END ${testInfo.status?.toUpperCase()} in ${testInfo.duration} ms`;
      if (testInfo.status === testInfo.expectedStatus) {
        logger.info(summary);
      } else {
        // Strip ANSI colour codes Playwright adds for the terminal reporter.
        const reason = testInfo.error?.message?.replace(/\u001b\[[0-9;]*m/g, '');
        logger.error(`${summary} (expected ${testInfo.expectedStatus})`, reason);
      }

      await testInfo.attach('execution-log', { body: logger.dump(), contentType: 'text/plain' });
    },
    { auto: true },
  ],

  loginPage: async ({ page, logger }, use) => {
    await use(new SauceLoginPage(page, logger));
  },
  inventoryPage: async ({ page, logger }, use) => {
    await use(new InventoryPage(page, logger));
  },
  cartPage: async ({ page, logger }, use) => {
    await use(new CartPage(page, logger));
  },
  checkoutInfoPage: async ({ page, logger }, use) => {
    await use(new CheckoutInformationPage(page, logger));
  },
  checkoutOverviewPage: async ({ page, logger }, use) => {
    await use(new CheckoutOverviewPage(page, logger));
  },
  checkoutCompletePage: async ({ page, logger }, use) => {
    await use(new CheckoutCompletePage(page, logger));
  },
  header: async ({ page, logger }, use) => {
    await use(new SauceHeaderComponent(page, logger));
  },
});

export { expect } from '@playwright/test';
