import { Locator, Page } from '@playwright/test';
import type { Logger } from '../../utils/logger';
import { SauceBasePage } from './SauceBasePage';

export class CartPage extends SauceBasePage {
  protected readonly path = '/cart.html';
  readonly items: Locator;
  readonly itemNames: Locator;
  readonly checkoutButton: Locator;
  readonly continueShoppingButton: Locator;

  constructor(page: Page, logger: Logger) {
    super(page, logger);
    this.items = page.getByTestId('inventory-item');
    this.itemNames = page.getByTestId('inventory-item-name');
    this.checkoutButton = page.getByRole('button', { name: 'Checkout' });
    this.continueShoppingButton = page.getByRole('button', { name: 'Continue Shopping' });
  }

  item(productName: string): Locator {
    return this.items.filter({ hasText: productName });
  }

  async remove(productName: string): Promise<void> {
    await this.step(`Remove "${productName}" from cart page`, async () => {
      await this.item(productName).getByRole('button', { name: 'Remove' }).click();
    });
  }

  async checkout(): Promise<void> {
    await this.step('Proceed to checkout', async () => {
      await this.checkoutButton.click();
    });
  }

  async continueShopping(): Promise<void> {
    await this.step('Continue shopping', async () => {
      await this.continueShoppingButton.click();
    });
  }
}
