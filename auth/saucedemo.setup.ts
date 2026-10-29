import { test as setup, expect } from '../fixtures/sauceFixtures';
import { sauceConfig, SAUCE_STORAGE_STATE } from '../config/saucedemo.config';

/**
 * Runs once per invocation (the "saucedemo-setup" project). Logs in through
 * the UI and saves the session cookie so every SauceDemo spec starts on an
 * authenticated page without repeating the login flow.
 */
setup('authenticate standard_user', async ({ page, loginPage, inventoryPage, logger }) => {
  await loginPage.goto();
  await loginPage.login(sauceConfig.users.standard, sauceConfig.password);
  await expect(inventoryPage.title).toHaveText('Products');

  await page.context().storageState({ path: SAUCE_STORAGE_STATE });
  logger.info(`Saved authenticated storage state to ${SAUCE_STORAGE_STATE}`);
});
