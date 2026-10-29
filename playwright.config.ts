import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { sauceConfig, SAUCE_STORAGE_STATE } from './config/saucedemo.config';

/**
 * Env selection happens BEFORE the config body runs, because tests read
 * process.env directly (config/environment.ts) and projects below need
 * BASE_URL/API_URL populated at definition time.
 */
const targetEnv = process.env.ENV ?? 'dev';
const envFile = targetEnv === 'dev' ? '.env' : `.env.${targetEnv}`;
dotenv.config({ path: path.resolve(__dirname, envFile) });

const STORAGE_STATE = path.resolve(__dirname, 'auth/storageState.json');

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  globalSetup: './config/global-setup.ts',
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },

  // No test suite may assume another test's order or side effects.
  fullyParallel: true,
  forbidOnly: !!process.env.CI,

  // Retries mask transient infra flakiness in CI; locally a retry would hide
  // a real bug during development, so we don't retry there.
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/html', open: 'never' }],
    ['junit', { outputFile: 'reports/junit/results.xml' }],
  ],

  use: {
    baseURL: process.env.BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // Runs once, logs in via the UI, and persists cookies/localStorage to
    // disk so every other project can start already authenticated.
    {
      name: 'setup',
      testDir: './auth',
      testMatch: /auth\.setup\.ts/,
    },

    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: STORAGE_STATE },
      testDir: './tests/ui',
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'], storageState: STORAGE_STATE },
      testDir: './tests/ui',
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'], storageState: STORAGE_STATE },
      testDir: './tests/ui',
      dependencies: ['setup'],
    },

    // End-to-end specs mix API setup with UI actions; they use the same
    // authenticated browser state as the UI projects.
    {
      name: 'e2e-chromium',
      use: { ...devices['Desktop Chrome'], storageState: STORAGE_STATE },
      testDir: './tests/e2e',
      dependencies: ['setup'],
    },

    // Pure API specs never open a browser and never need storageState.
    {
      name: 'api',
      testDir: './tests/api',
      use: { baseURL: process.env.API_URL },
    },

    // SauceDemo (https://www.saucedemo.com) — a public practice app, so these
    // projects run with no secrets. SauceDemo marks elements with `data-test`,
    // which getByTestId() is pointed at here.
    {
      name: 'saucedemo-setup',
      testDir: './auth',
      testMatch: /saucedemo\.setup\.ts/,
      use: { baseURL: sauceConfig.baseUrl, testIdAttribute: 'data-test' },
    },
    {
      name: 'saucedemo-chromium',
      testDir: './tests/saucedemo',
      dependencies: ['saucedemo-setup'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: sauceConfig.baseUrl,
        testIdAttribute: 'data-test',
        storageState: SAUCE_STORAGE_STATE,
      },
    },
    {
      name: 'saucedemo-firefox',
      testDir: './tests/saucedemo',
      dependencies: ['saucedemo-setup'],
      use: {
        ...devices['Desktop Firefox'],
        baseURL: sauceConfig.baseUrl,
        testIdAttribute: 'data-test',
        storageState: SAUCE_STORAGE_STATE,
      },
    },
  ],
});


/* import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Test folder
  testDir: './tests',

  // Test execution
  timeout: 30 * 1000,
  expect: {
    timeout: 5000
  },

  // Parallel execution
  fullyParallel: true,
  workers: 2,

  // Retry failed tests in CI
  retries: process.env.CI ? 2 : 0,

  // Reporting
  reporter: [
    ['html', { open: 'never' }],
    ['list']
  ],

  // Shared settings
  use: {
    baseURL: 'https://example.com',
    headless: true,

    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',

    actionTimeout: 15000,
    navigationTimeout: 30000
  },

  // Browser projects
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    }
  ]
}); */