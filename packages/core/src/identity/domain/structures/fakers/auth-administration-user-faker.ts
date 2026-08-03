import { faker } from '@faker-js/faker'

import type { AuthAdministrationUser } from '../auth-administration-user'

export class AuthAdministrationUserFaker {
  static fake(overrides: Partial<AuthAdministrationUser> = {}): AuthAdministrationUser {
    return {
      authUserId: faker.string.uuid(),
      email: faker.internet.email(),
      isConfirmed: false,
      invitationAttemptId: faker.string.uuid(),
      ...overrides,
    }
  }
}
