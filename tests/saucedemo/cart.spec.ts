import { test, expect } from '../../fixtures/sauceFixtures';

test.describe('SauceDemo cart', () => {
  const products = ['Sauce Labs Backpack', 'Sauce Labs Fleece Jacket'];

  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.goto();
    await inventoryPage.addToCart(...products);
  });

  test('cart lists every added product @smoke @regression', async ({ page, header, cartPage }) => {
    // Act
    await header.openCart();

    // Assert
    await expect(page).toHaveURL(/cart\.html/);
    await expect(cartPage.title).toHaveText('Your Cart');
    await expect(cartPage.itemNames).toHaveText(products);
  });

  test('removing an item from the cart page updates the cart @regression', async ({ header, cartPage }) => {
    // Arrange
    await header.openCart();

    // Act
    await cartPage.remove(products[0]);

    // Assert
    await expect(cartPage.itemNames).toHaveText([products[1]]);
    await expect(header.cartBadge).toHaveText('1');
  });

  test('cart contents survive navigating back to products @regression', async ({
    header,
    cartPage,
    inventoryPage,
  }) => {
    // Arrange
    await header.openCart();

    // Act
    await cartPage.continueShopping();

    // Assert
    await expect(inventoryPage.title).toHaveText('Products');
    await expect(header.cartBadge).toHaveText(String(products.length));
  });
});
