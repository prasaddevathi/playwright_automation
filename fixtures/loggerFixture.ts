import { test as base } from '@playwright/test';
import { Logger } from '../utils/logger';

type LoggerFixtures = {
  logger: Logger;
};

/**
 * Base test for every fixture file in the framework (testFixtures.ts,
 * sauceFixtures.ts). Extending it is all a new fixture file needs to get
 * logging for every test.
 *
 * `logger` is an auto fixture, so EVERY test is logged, even one that never
 * asks for it: start / end with status, duration and retry number, and the
 * failure message when a test does not pass. At teardown the test's full log
 * is attached to its HTML report entry as `execution-log`.
 *
 * Browser-side evidence (console errors, uncaught page errors, failed and
 * 4xx/5xx requests) is captured by wrapping the built-in `page` fixture
 * rather than inside `logger`. That way a pure API test, which never asks
 * for `page`, is still logged but never launches a browser just for logging.
 */
export const test = base.extend<LoggerFixtures>({
  logger: [
    async ({}, use, testInfo) => {
      const logger = Logger.create(testInfo.titlePath.slice(1).join(' › '));
      logger.info(`▶ START (project: ${testInfo.project.name}, retry: ${testInfo.retry})`);

      await use(logger);

      const summary = `■ END ${testInfo.status?.toUpperCase()} in ${testInfo.duration} ms`;
      if (testInfo.status === testInfo.expectedStatus) {
        logger.info(summary);
      } else {
        logger.error(`${summary} (expected ${testInfo.expectedStatus})`, testInfo.error?.message);
      }

      await testInfo.attach('execution-log', { body: logger.dump(), contentType: 'text/plain' });
    },
    { auto: true },
  ],

  page: async ({ page, logger }, use) => {
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
    await use(page);
  },
});

export { expect } from '@playwright/test';
