import { test, expect } from '../../fixtures/testFixtures';
import { buildRandomUser } from '../../utils/testDataUtils';
import { config } from '../../config/environment';
import usersTestData from '../../test-data/users.json';

test.describe('@e2e @critical User lifecycle (API -> UI -> API)', () => {
  test('user created via API is visible and editable in the UI, then cleaned up', async ({
    usersPage,
    apiClient,
  }) => {
    // Arrange: create prerequisite data via API — faster and more reliable
    // than creating it through the UI just to set up the real test.
    const seedUser = buildRandomUser();
    const createdUser = await apiClient.createUser(seedUser);

    try {
      // Act: locate and edit the user through the UI
      await usersPage.goto();
      await usersPage.searchUser(seedUser.firstName);
      await usersPage.editUser(seedUser.firstName);
      const updatedEmail = `updated.${createdUser.id}@example.com`;
      await usersPage.updateEmail(updatedEmail);

      // Assert: UI confirms the change
      await expect(usersPage.successToast).toBeVisible();

      // Assert: API reflects the same change
      const refreshedUser = await apiClient.getUser(createdUser.id);
      expect(refreshedUser.email).toBe(updatedEmail);
    } finally {
      // Cleanup: remove the user regardless of test outcome
      await apiClient.deleteUser(createdUser.id);
    }
  });
});

test.describe('@e2e @critical Complete user management workflow', () => {
  // This scenario validates login itself, so it must start signed out
  // rather than reusing the shared authenticated storageState.
  test.use({ storageState: { cookies: [], origins: [] } });

  test('login, edit a user profile, and logout', async ({
    page,
    loginPage,
    navigation,
    usersPage,
    header,
  }) => {
    // Arrange
    const targetUser = usersTestData.searchableUser;
    const updatedEmail = `workflow.${Date.now()}@example.com`;
    await loginPage.goto();

    // Act: login -> navigate -> search -> edit -> save
    await loginPage.login(config.username, config.password);
    await navigation.goToUsers();
    await usersPage.searchUser(targetUser.firstName);
    await usersPage.editUser(targetUser.firstName);
    await usersPage.updateEmail(updatedEmail);

    // Assert: success message and updated row
    await expect(usersPage.successToast).toBeVisible();
    await expect(usersPage.rowEmailCell(targetUser.firstName)).toHaveText(updatedEmail);

    // Act: logout
    await header.logout();

    // Assert: back at login
    await expect(page).toHaveURL(/login/);
  });
});
