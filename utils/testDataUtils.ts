import { faker } from '@faker-js/faker';
import type { User } from '../types/testData.types';

/**
 * Generates a unique user per call. Random-but-deterministic-enough test
 * data avoids two parallel workers colliding on the same email/username —
 * the most common source of "works alone, fails in the suite" flakiness.
 */
export function buildRandomUser(overrides: Partial<User> = {}): User {
  return {
    id: '',
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    role: 'Standard User',
    ...overrides,
  };
}
