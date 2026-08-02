import { faker } from '@faker-js/faker'

import type { AuthCredentials } from '../auth-credentials'

export class AuthCredentialsFaker {
  static fake(overrides: Partial<AuthCredentials> = {}): AuthCredentials {
    return {
      identifier: faker.internet.email(),
      password: faker.internet.password({ length: 16 }),
      ...overrides,
    }
  }
}
