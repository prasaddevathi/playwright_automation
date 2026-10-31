import { Locator, Page } from '@playwright/test';
import type { Logger } from '../../utils/logger';
import { loggedStep } from '../../utils/step';

/**
 * The header (burger menu + cart) is shared by every authenticated
 * SauceDemo page, so it is a component composed through a fixture rather
 * than duplicated in each page object.
 */
export class SauceHeaderComponent {
  private readonly log: Logger;
  readonly cartLink: Locator;
  readonly cartBadge: Locator;
  readonly openMenuButton: Locator;
  readonly logoutLink: Locator;
  readonly resetAppStateLink: Locator;

  constructor(page: Page, logger: Logger) {
    this.log = logger.child('SauceHeaderComponent');
    this.cartLink = page.getByTestId('shopping-cart-link');
    this.cartBadge = page.getByTestId('shopping-cart-badge');
    this.openMenuButton = page.getByRole('button', { name: 'Open Menu' });
    this.logoutLink = page.getByTestId('logout-sidebar-link');
    this.resetAppStateLink = page.getByTestId('reset-sidebar-link');
  }

  async openCart(): Promise<void> {
    await loggedStep(this.log, 'Open cart', () => this.cartLink.click());
  }

  async logout(): Promise<void> {
    await loggedStep(this.log, 'Log out via side menu', async () => {
      await this.openMenuButton.click();
      await this.logoutLink.click();
    });
  }
}
