import { Locator, Page } from '@playwright/test';
import type { Logger } from '../../utils/logger';
import type { Product, SortOption } from '../../types/saucedemo.types';
import { parsePrice } from '../../utils/sauceDataUtils';
import { SauceBasePage } from './SauceBasePage';

export class InventoryPage extends SauceBasePage {
  protected readonly path = '/inventory.html';
  readonly items: Locator;
  readonly itemNames: Locator;
  readonly itemPrices: Locator;
  readonly sortDropdown: Locator;

  constructor(page: Page, logger: Logger) {
    super(page, logger);
    this.items = page.getByTestId('inventory-item');
    this.itemNames = page.getByTestId('inventory-item-name');
    this.itemPrices = page.getByTestId('inventory-item-price');
    this.sortDropdown = page.getByTestId('product-sort-container');
  }

  /** A single product card, located by its visible name. */
  item(productName: string): Locator {
    return this.items.filter({ has: this.page.getByText(productName, { exact: true }) });
  }

  addToCartButton(productName: string): Locator {
    return this.item(productName).getByRole('button', { name: 'Add to cart' });
  }

  removeButton(productName: string): Locator {
    return this.item(productName).getByRole('button', { name: 'Remove' });
  }

  async addToCart(...productNames: string[]): Promise<void> {
    for (const name of productNames) {
      await this.step(`Add "${name}" to cart`, async () => {
        await this.addToCartButton(name).click();
      });
    }
  }

  async removeFromCart(productName: string): Promise<void> {
    await this.step(`Remove "${productName}" from cart`, async () => {
      await this.removeButton(productName).click();
    });
  }

  async sortBy(option: SortOption): Promise<void> {
    await this.step(`Sort products by "${option}"`, async () => {
      await this.sortDropdown.selectOption(option);
    });
  }

  async getDisplayedProducts(): Promise<Product[]> {
    const names = await this.itemNames.allTextContents();
    const prices = (await this.itemPrices.allTextContents()).map(parsePrice);
    const products = names.map((name, i) => ({ name, price: prices[i] }));
    this.log.debug(`Read ${products.length} displayed products`, products);
    return products;
  }

  async openProduct(productName: string): Promise<void> {
    await this.step(`Open product details for "${productName}"`, async () => {
      await this.item(productName).getByTestId('inventory-item-name').click();
    });
  }
}
