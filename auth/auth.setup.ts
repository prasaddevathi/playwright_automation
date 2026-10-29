import { test as setup } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { config } from '../config/environment';

const authFile = 'auth/storageState.json';

/**
 * Runs once per full `playwright test` invocation (the "setup" project in
 * playwright.config.ts). Every other project depends on it and reuses the
 * resulting storageState, so a normal UI test never repeats a UI login.
 */
setup('authenticate', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(config.username, config.password);
  await page.waitForURL(/dashboard/);
  await page.context().storageState({ path: authFile });
});
