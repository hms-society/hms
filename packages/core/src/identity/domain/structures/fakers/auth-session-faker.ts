import { faker } from '@faker-js/faker'

import type { AuthSession } from '../auth-session'
import { AuthUserFaker } from './auth-user-faker'

export class AuthSessionFaker {
  static fake(overrides: Partial<AuthSession> = {}): AuthSession {
    return {
      accessToken: faker.string.alphanumeric({ length: 32 }),
      refreshToken: faker.string.alphanumeric({ length: 32 }),
      expiresAt: faker.number.int({ min: 1_000_000_000, max: 2_000_000_000 }),
      sessionId: faker.string.uuid(),
      user: AuthUserFaker.fake(),
      ...overrides,
    }
  }
}
