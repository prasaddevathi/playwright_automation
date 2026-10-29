import { Locator, Page } from '@playwright/test';
import type { Logger } from '../../utils/logger';
import type { CustomerInfo } from '../../types/saucedemo.types';
import { parsePrice } from '../../utils/sauceDataUtils';
import { SauceBasePage } from './SauceBasePage';

/** Step one: customer information form. */
export class CheckoutInformationPage extends SauceBasePage {
  protected readonly path = '/checkout-step-one.html';
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly postalCodeInput: Locator;
  readonly continueButton: Locator;
  readonly cancelButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page, logger: Logger) {
    super(page, logger);
    this.firstNameInput = page.getByPlaceholder('First Name');
    this.lastNameInput = page.getByPlaceholder('Last Name');
    this.postalCodeInput = page.getByPlaceholder('Zip/Postal Code');
    this.continueButton = page.getByRole('button', { name: 'Continue' });
    this.cancelButton = page.getByRole('button', { name: 'Cancel' });
    this.errorMessage = page.getByTestId('error');
  }

  async fillCustomerInfo(info: Partial<CustomerInfo>): Promise<void> {
    await this.step('Fill customer information', async () => {
      this.log.debug('Customer info', info);
      if (info.firstName !== undefined) await this.firstNameInput.fill(info.firstName);
      if (info.lastName !== undefined) await this.lastNameInput.fill(info.lastName);
      if (info.postalCode !== undefined) await this.postalCodeInput.fill(info.postalCode);
    });
  }

  async continue(): Promise<void> {
    await this.step('Continue to overview', async () => {
      await this.continueButton.click();
    });
  }
}

/** Step two: order overview with totals. */
export class CheckoutOverviewPage extends SauceBasePage {
  protected readonly path = '/checkout-step-two.html';
  readonly itemNames: Locator;
  readonly subtotalLabel: Locator;
  readonly taxLabel: Locator;
  readonly totalLabel: Locator;
  readonly finishButton: Locator;

  constructor(page: Page, logger: Logger) {
    super(page, logger);
    this.itemNames = page.getByTestId('inventory-item-name');
    this.subtotalLabel = page.getByTestId('subtotal-label');
    this.taxLabel = page.getByTestId('tax-label');
    this.totalLabel = page.getByTestId('total-label');
    this.finishButton = page.getByRole('button', { name: 'Finish' });
  }

  async getTotals(): Promise<{ subtotal: number; tax: number; total: number }> {
    const totals = {
      subtotal: parsePrice(await this.subtotalLabel.innerText()),
      tax: parsePrice(await this.taxLabel.innerText()),
      total: parsePrice(await this.totalLabel.innerText()),
    };
    this.log.info('Order totals', totals);
    return totals;
  }

  async finish(): Promise<void> {
    await this.step('Finish order', async () => {
      await this.finishButton.click();
    });
  }
}

/** Order confirmation. */
export class CheckoutCompletePage extends SauceBasePage {
  protected readonly path = '/checkout-complete.html';
  readonly confirmationHeader: Locator;
  readonly backHomeButton: Locator;

  constructor(page: Page, logger: Logger) {
    super(page, logger);
    this.confirmationHeader = page.getByTestId('complete-header');
    this.backHomeButton = page.getByRole('button', { name: 'Back Home' });
  }

  async backHome(): Promise<void> {
    await this.step('Return to products', async () => {
      await this.backHomeButton.click();
    });
  }
}
