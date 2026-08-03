import { faker } from '@faker-js/faker'

import type { AuthUser } from '../auth-user'

export class AuthUserFaker {
  static fake(overrides: Partial<AuthUser> = {}): AuthUser {
    return {
      id: faker.string.uuid(),
      email: faker.internet.email(),
      ...overrides,
    }
  }
}
