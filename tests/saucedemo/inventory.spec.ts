import { test, expect } from '../../fixtures/sauceFixtures';
import { catalog } from '../../utils/sauceDataUtils';
import type { Product, SortOption } from '../../types/saucedemo.types';

test.describe('SauceDemo inventory', () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.goto();
  });

  test('displays the full product catalog @smoke @regression', async ({ inventoryPage }) => {
    // Assert
    await expect(inventoryPage.title).toHaveText('Products');
    await expect(inventoryPage.items).toHaveCount(catalog.length);

    const displayed = await inventoryPage.getDisplayedProducts();
    expect(displayed).toEqual(expect.arrayContaining([...catalog]));
  });

  const sortCases: { option: SortOption; label: string; compare: (a: Product, b: Product) => number }[] = [
    { option: 'az', label: 'name A→Z', compare: (a, b) => a.name.localeCompare(b.name) },
    { option: 'za', label: 'name Z→A', compare: (a, b) => b.name.localeCompare(a.name) },
    { option: 'lohi', label: 'price low→high', compare: (a, b) => a.price - b.price },
    { option: 'hilo', label: 'price high→low', compare: (a, b) => b.price - a.price },
  ];

  for (const { option, label, compare } of sortCases) {
    test(`sorts products by ${label} @regression`, async ({ inventoryPage }) => {
      // Act
      await inventoryPage.sortBy(option);

      // Assert — compare only the sort key, so equal-priced items may tie in any order.
      const displayed = await inventoryPage.getDisplayedProducts();
      const expected = [...displayed].sort(compare);
      const key = option === 'az' || option === 'za' ? 'name' : 'price';
      expect(displayed.map((p) => p[key])).toEqual(expected.map((p) => p[key]));
    });
  }

  test('adding and removing products updates the cart badge @smoke @regression', async ({
    inventoryPage,
    header,
  }) => {
    // Act
    await inventoryPage.addToCart('Sauce Labs Backpack', 'Sauce Labs Bike Light');

    // Assert
    await expect(header.cartBadge).toHaveText('2');
    await expect(inventoryPage.removeButton('Sauce Labs Backpack')).toBeVisible();

    // Act
    await inventoryPage.removeFromCart('Sauce Labs Backpack');

    // Assert
    await expect(header.cartBadge).toHaveText('1');
    await expect(inventoryPage.addToCartButton('Sauce Labs Backpack')).toBeVisible();
  });
});
