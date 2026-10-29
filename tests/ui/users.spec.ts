import { test, expect } from '../../fixtures/testFixtures';
import { buildRandomUser } from '../../utils/testDataUtils';

test.describe('@regression Users management', () => {
  test('admin can search and edit an existing user', async ({ usersPage, apiClient }) => {
    // Arrange: seed a user via the API instead of reusing a shared fixture
    // record, so parallel workers never edit the same row at the same time.
    const seedUser = buildRandomUser();
    const createdUser = await apiClient.createUser(seedUser);

    try {
      await usersPage.goto();
      const updatedEmail = `updated.${createdUser.id}@example.com`;

      // Act
      await usersPage.searchUser(seedUser.firstName);
      await usersPage.editUser(seedUser.firstName);
      await usersPage.updateEmail(updatedEmail);

      // Assert
      await expect(usersPage.successToast).toBeVisible();
      await expect(usersPage.rowEmailCell(seedUser.firstName)).toHaveText(updatedEmail);
    } finally {
      // Cleanup: never leave test-created data behind for later runs.
      await apiClient.deleteUser(createdUser.id);
    }
  });

  test('searching for a non-existent user shows no results', async ({ usersPage }) => {
    // Arrange
    await usersPage.goto();

    // Act
    await usersPage.searchUser('NoSuchUser12345');

    // Assert
    expect(await usersPage.isUserListed('NoSuchUser12345')).toBeFalsy();
  });
});
