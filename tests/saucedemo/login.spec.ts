import { test, expect } from '../../fixtures/sauceFixtures';
import { sauceConfig } from '../../config/saucedemo.config';

test.describe('SauceDemo login', () => {
  // Login specs must start signed out, not from the shared storageState.
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('standard user can log in @smoke @regression', async ({ page, loginPage, inventoryPage }) => {
    // Act
    await loginPage.login(sauceConfig.users.standard, sauceConfig.password);

    // Assert
    await expect(page).toHaveURL(/inventory\.html/);
    await expect(inventoryPage.title).toHaveText('Products');
  });

  test('locked-out user is rejected with a clear message @regression', async ({ page, loginPage }) => {
    // Act
    await loginPage.login(sauceConfig.users.lockedOut, sauceConfig.password);

    // Assert
    await expect(loginPage.errorMessage).toHaveText('Epic sadface: Sorry, this user has been locked out.');
    await expect(page).not.toHaveURL(/inventory\.html/);
  });

  // Data-driven negative cases: one generated test per row.
  const invalidLogins = [
    { case: 'wrong password', username: sauceConfig.users.standard, password: 'not-the-password', error: /Username and password do not match/ },
    { case: 'unknown user', username: 'no_such_user', password: sauceConfig.password, error: /Username and password do not match/ },
    { case: 'empty username', username: '', password: sauceConfig.password, error: /Username is required/ },
    { case: 'empty password', username: sauceConfig.users.standard, password: '', error: /Password is required/ },
  ];

  for (const { case: caseName, username, password, error } of invalidLogins) {
    test(`login fails with ${caseName} @regression`, async ({ loginPage }) => {
      // Act
      await loginPage.login(username, password);

      // Assert
      await expect(loginPage.errorMessage).toBeVisible();
      await expect(loginPage.errorMessage).toHaveText(error);
    });
  }

  test('user can log out and protected pages become inaccessible @regression', async ({
    page,
    loginPage,
    header,
  }) => {
    // Arrange
    await loginPage.login(sauceConfig.users.standard, sauceConfig.password);

    // Act
    await header.logout();

    // Assert
    await expect(loginPage.loginButton).toBeVisible();
    await page.goto('/inventory.html');
    await expect(loginPage.errorMessage).toContainText("You can only access '/inventory.html' when you are logged in.");
  });
});
