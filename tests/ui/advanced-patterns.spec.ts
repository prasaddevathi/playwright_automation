import path from 'path';
import { test, expect } from '../../fixtures/testFixtures';
import { assertFileNameMatches, downloadsDir } from '../../utils/fileUtils';

test.describe('@regression Network handling and file operations', () => {
  test('mocks the users API response to test the empty state', async ({ page, usersPage }) => {
    // Arrange: intercept the users list call and force an empty result.
    // Mocking is appropriate here because we are testing the UI's own
    // empty-state rendering, not whether the backend can return zero users —
    // that belongs in an API/integration test instead.
    await page.route('**/api/users**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ users: [] }),
      });
    });

    // Act
    await usersPage.goto();

    // Assert
    await expect(page.getByText('No users found')).toBeVisible();
  });

  test('waits for the search API response before asserting results', async ({ page, usersPage }) => {
    // Arrange
    await usersPage.goto();
    const responsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/users') && response.status() === 200,
    );

    // Act
    await usersPage.searchUser('Prasad');
    await responsePromise;

    // Assert
    expect(await usersPage.isUserListed('Prasad')).toBeTruthy();
  });

  test('uploads a user avatar file', async ({ page, usersPage }) => {
    // Arrange
    await usersPage.goto();
    await usersPage.editUser('Prasad');

    // Act
    await page
      .getByLabel('Upload avatar')
      .setInputFiles(path.join(__dirname, '../../test-data/sample-upload.txt'));

    // Assert
    await expect(page.getByText('Avatar uploaded')).toBeVisible();
  });

  test('downloads a users export file and validates its name', async ({ page, usersPage }) => {
    // Arrange
    await usersPage.goto();
    const downloadPromise = page.waitForEvent('download');

    // Act
    await page.getByRole('button', { name: 'Export users' }).click();
    const download = await downloadPromise;
    await download.saveAs(path.join(downloadsDir(), download.suggestedFilename()));

    // Assert
    assertFileNameMatches(download.suggestedFilename(), /^users-export-.*\.csv$/);
  });
});
