// @ts-check
const tseslint = require('typescript-eslint');
const playwright = require('eslint-plugin-playwright');

module.exports = tseslint.config(
  {
    ignores: [
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
      'reports/**',
      'downloads/**',
      'auth/storageState.json',
      'auth/*.storageState.json',
    ],
  },
  {
    files: ['**/*.ts'],
    extends: [...tseslint.configs.recommended],
  },
  {
    files: ['tests/**/*.ts'],
    plugins: { playwright },
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      'playwright/expect-expect': ['error', { assertFunctionNames: ['expect', 'assertFileNameMatches'] }],
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-conditional-in-test': 'off',
    },
  },
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
);
