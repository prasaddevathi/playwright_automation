import { test, expect } from '../../fixtures/sauceFixtures';
import { buildCustomerInfo, getProduct } from '../../utils/sauceDataUtils';

test.describe('SauceDemo checkout', () => {
  test('customer can complete a purchase with correct totals @smoke @regression @e2e', async ({
    page,
    logger,
    inventoryPage,
    header,
    cartPage,
    checkoutInfoPage,
    checkoutOverviewPage,
    checkoutCompletePage,
  }) => {
    // Arrange
    const order = [getProduct('Sauce Labs Backpack'), getProduct('Sauce Labs Bolt T-Shirt')];
    const expectedSubtotal = order.reduce((sum, p) => sum + p.price, 0);
    const customer = buildCustomerInfo();
    logger.info('Placing order', { products: order.map((p) => p.name), expectedSubtotal });

    await inventoryPage.goto();
    await inventoryPage.addToCart(...order.map((p) => p.name));

    // Act
    await header.openCart();
    await cartPage.checkout();
    await checkoutInfoPage.fillCustomerInfo(customer);
    await checkoutInfoPage.continue();

    // Assert — overview shows the right items and the arithmetic holds.
    await expect(checkoutOverviewPage.title).toHaveText('Checkout: Overview');
    await expect(checkoutOverviewPage.itemNames).toHaveText(order.map((p) => p.name));

    const { subtotal, tax, total } = await checkoutOverviewPage.getTotals();
    expect(subtotal).toBeCloseTo(expectedSubtotal, 2);
    expect(total).toBeCloseTo(subtotal + tax, 2);

    // Act
    await checkoutOverviewPage.finish();

    // Assert
    await expect(page).toHaveURL(/checkout-complete\.html/);
    await expect(checkoutCompletePage.confirmationHeader).toHaveText('Thank you for your order!');
    await expect(header.cartBadge).toBeHidden();
  });

  const missingFieldCases = [
    { field: 'first name', info: buildCustomerInfo({ firstName: '' }), error: 'Error: First Name is required' },
    { field: 'last name', info: buildCustomerInfo({ lastName: '' }), error: 'Error: Last Name is required' },
    { field: 'postal code', info: buildCustomerInfo({ postalCode: '' }), error: 'Error: Postal Code is required' },
  ];

  for (const { field, info, error } of missingFieldCases) {
    test(`checkout is blocked when ${field} is missing @regression`, async ({
      page,
      inventoryPage,
      checkoutInfoPage,
    }) => {
      // Arrange
      await inventoryPage.goto();
      await inventoryPage.addToCart('Sauce Labs Onesie');
      await checkoutInfoPage.goto();

      // Act
      await checkoutInfoPage.fillCustomerInfo(info);
      await checkoutInfoPage.continue();

      // Assert
      await expect(checkoutInfoPage.errorMessage).toHaveText(error);
      await expect(page).toHaveURL(/checkout-step-one\.html/);
    });
  }
});
