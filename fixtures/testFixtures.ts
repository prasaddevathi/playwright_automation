import { test as base } from './loggerFixture';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { UsersPage } from '../pages/UsersPage';
import { HeaderComponent } from '../components/HeaderComponent';
import { NavigationComponent } from '../components/NavigationComponent';
import { ApiClient } from '../utils/apiUtils';

type AppFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  usersPage: UsersPage;
  header: HeaderComponent;
  navigation: NavigationComponent;
  apiClient: ApiClient;
};

/**
 * Every test gets its own page-object instances, freshly constructed
 * against that test's isolated `page`. This is why fixtures beat
 * `new LoginPage(page)` inside each test body:
 *  - no boilerplate repeated in every spec
 *  - a page object's constructor can change once, here, instead of at
 *    every call site
 *  - fixtures are lazy: `usersPage` is only instantiated if a test
 *    actually declares it as a parameter
 *  - fixtures compose (apiClient disposes itself after the test; a page
 *    object never has to know that)
 *
 * Extends loggerFixture.ts, so every test is logged automatically and each
 * page object, component and the API client log into that test's log.
 */
export const test = base.extend<AppFixtures>({
  loginPage: async ({ page, logger }, use) => {
    await use(new LoginPage(page, logger));
  },
  dashboardPage: async ({ page, logger }, use) => {
    await use(new DashboardPage(page, logger));
  },
  usersPage: async ({ page, logger }, use) => {
    await use(new UsersPage(page, logger));
  },
  header: async ({ page, logger }, use) => {
    await use(new HeaderComponent(page, logger));
  },
  navigation: async ({ page, logger }, use) => {
    await use(new NavigationComponent(page, logger));
  },
  apiClient: async ({ logger }, use) => {
    const client = await ApiClient.create(logger);
    await use(client);
    await client.dispose();
  },
});

export { expect } from '@playwright/test';
