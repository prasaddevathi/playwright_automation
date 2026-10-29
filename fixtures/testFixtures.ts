import { test as base } from '@playwright/test';
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
 */
export const test = base.extend<AppFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  usersPage: async ({ page }, use) => {
    await use(new UsersPage(page));
  },
  header: async ({ page }, use) => {
    await use(new HeaderComponent(page));
  },
  navigation: async ({ page }, use) => {
    await use(new NavigationComponent(page));
  },
  apiClient: async ({}, use) => {
    const client = await ApiClient.create();
    await use(client);
    await client.dispose();
  },
});

export { expect } from '@playwright/test';
