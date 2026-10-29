/**
 * Settings for the public SauceDemo application (https://www.saucedemo.com).
 *
 * Unlike config/environment.ts, nothing here is required: SauceDemo is a
 * public practice app whose test users are published on its login page, so
 * sensible defaults let the suite run with zero setup. Every value can still
 * be overridden from the environment (e.g. to point at a self-hosted copy).
 *
 * Getters, not plain values: playwright.config.ts imports this module, and
 * ES imports are hoisted above its dotenv.config() call — reading
 * process.env lazily is what lets SAUCE_* values from a .env file apply.
 */
export const sauceConfig = {
  get baseUrl(): string {
    return process.env.SAUCE_BASE_URL ?? 'https://www.saucedemo.com';
  },
  get password(): string {
    return process.env.SAUCE_PASSWORD ?? 'secret_sauce';
  },
  users: {
    get standard(): string {
      return process.env.SAUCE_STANDARD_USER ?? 'standard_user';
    },
    lockedOut: 'locked_out_user',
    problem: 'problem_user',
    performanceGlitch: 'performance_glitch_user',
  },
};

export const SAUCE_STORAGE_STATE = 'auth/saucedemo.storageState.json';
