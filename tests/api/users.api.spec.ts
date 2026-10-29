import { test, expect } from '../../fixtures/testFixtures';
import { buildRandomUser } from '../../utils/testDataUtils';

test.describe('@api Users API', () => {
  test('creates and retrieves a user', async ({ apiClient }) => {
    // Arrange
    const newUser = buildRandomUser();

    // Act
    const created = await apiClient.createUser(newUser);

    try {
      // Assert
      expect(created.id).toBeTruthy();
      expect(created.email).toBe(newUser.email);

      const fetched = await apiClient.getUser(created.id);
      expect(fetched.email).toBe(newUser.email);
    } finally {
      // Cleanup
      await apiClient.deleteUser(created.id);
    }
  });

  test('deleting a user is idempotent', async ({ apiClient }) => {
    // Arrange
    const created = await apiClient.createUser(buildRandomUser());

    // Act
    await apiClient.deleteUser(created.id);

    // Assert: a second delete of the same id must not throw
    await expect(apiClient.deleteUser(created.id)).resolves.not.toThrow();
  });
});
