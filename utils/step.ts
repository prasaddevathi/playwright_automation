import { test } from '@playwright/test';
import type { Logger } from './logger';

/**
 * The one place where logging and reporting meet. Every page-object and
 * component action in the framework goes through this function, which:
 *  - logs `→ name` when the action starts
 *  - runs it inside a Playwright `test.step`, so it appears as a named,
 *    timed node in the HTML report and trace viewer
 *  - logs `✓ name (N ms)` on success, or `✗ name failed after N ms` with
 *    the error before rethrowing it
 *
 * `box: true` makes a failure point at the test line that called the
 * action rather than at a line inside the page object.
 */
export async function loggedStep<T>(log: Logger, name: string, body: () => Promise<T>): Promise<T> {
  const started = Date.now();
  log.info(`→ ${name}`);
  try {
    const result = await test.step(name, body, { box: true });
    log.debug(`✓ ${name} (${Date.now() - started} ms)`);
    return result;
  } catch (error) {
    log.error(`✗ ${name} failed after ${Date.now() - started} ms`, error);
    throw error;
  }
}
