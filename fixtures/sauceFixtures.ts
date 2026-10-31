import { test as base } from './loggerFixture';
import { SauceLoginPage } from '../pages/saucedemo/SauceLoginPage';
import { InventoryPage } from '../pages/saucedemo/InventoryPage';
import { CartPage } from '../pages/saucedemo/CartPage';
import {
  CheckoutCompletePage,
  CheckoutInformationPage,
  CheckoutOverviewPage,
} from '../pages/saucedemo/CheckoutPages';
import { SauceHeaderComponent } from '../components/saucedemo/SauceHeaderComponent';

type SauceFixtures = {
  loginPage: SauceLoginPage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutInfoPage: CheckoutInformationPage;
  checkoutOverviewPage: CheckoutOverviewPage;
  checkoutCompletePage: CheckoutCompletePage;
  header: SauceHeaderComponent;
};

/**
 * SauceDemo page objects, each built with the test's own `page` and
 * `logger`. The auto `logger` fixture and browser-event capture come from
 * loggerFixture.ts, shared with the rest of the framework.
 */
export const test = base.extend<SauceFixtures>({
  loginPage: async ({ page, logger }, use) => {
    await use(new SauceLoginPage(page, logger));
  },
  inventoryPage: async ({ page, logger }, use) => {
    await use(new InventoryPage(page, logger));
  },
  cartPage: async ({ page, logger }, use) => {
    await use(new CartPage(page, logger));
  },
  checkoutInfoPage: async ({ page, logger }, use) => {
    await use(new CheckoutInformationPage(page, logger));
  },
  checkoutOverviewPage: async ({ page, logger }, use) => {
    await use(new CheckoutOverviewPage(page, logger));
  },
  checkoutCompletePage: async ({ page, logger }, use) => {
    await use(new CheckoutCompletePage(page, logger));
  },
  header: async ({ page, logger }, use) => {
    await use(new SauceHeaderComponent(page, logger));
  },
});

export { expect } from '@playwright/test';
