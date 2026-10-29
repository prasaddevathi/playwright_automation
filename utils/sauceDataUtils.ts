import { faker } from '@faker-js/faker';
import products from '../test-data/saucedemo/products.json';
import type { CustomerInfo, Product } from '../types/saucedemo.types';

/** The fixed SauceDemo catalog — the expected source of truth for assertions. */
export const catalog: readonly Product[] = products;

export function getProduct(name: string): Product {
  const product = catalog.find((p) => p.name === name);
  if (!product) {
    throw new Error(`Product "${name}" is not in test-data/saucedemo/products.json`);
  }
  return product;
}

export function buildCustomerInfo(overrides: Partial<CustomerInfo> = {}): CustomerInfo {
  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    postalCode: faker.location.zipCode('#####'),
    ...overrides,
  };
}

/** Parses "$29.99" / "Item total: $29.99" into 29.99. */
export function parsePrice(text: string): number {
  const match = text.match(/\$(\d+(?:\.\d+)?)/);
  if (!match) {
    throw new Error(`No price found in "${text}"`);
  }
  return Number(match[1]);
}
