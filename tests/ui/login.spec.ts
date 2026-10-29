import { test, expect } from '../../fixtures/testFixtures';
import { config } from '../../config/environment';

test.describe('@smoke @critical Login', () => {
  // Login is the one flow that must NOT start from the pre-authenticated
  // storageState every other UI test uses — it needs a signed-out browser.
  test.use({ storageState: { cookies: [], origins: [] } });

  test('user can log in with valid credentials', async ({ page, loginPage, dashboardPage }) => {
    // Arrange
    await loginPage.goto();


    // Act
    await loginPage.login(config.username, config.password);

    // Assert
    await expect(page).toHaveURL(/dashboard/);
    await expect(dashboardPage.welcomeHeading).toBeVisible();
    await expect(dashboardPage.welcomeHeading).toHaveText('Welcome to the Dashboard');
  });

  test('user sees an error message with invalid credentials', async ({ loginPage }) => {
    // Arrange
    await loginPage.goto();

    // Act
    await loginPage.login('invalid.user', 'wrong-password');

    // Assert
    await expect(loginPage.loginErrorMessage).toBeVisible();
    await expect(loginPage.loginErrorMessage).toHaveText(/invalid username or password/i);
  });
});
