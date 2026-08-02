import { faker } from '@faker-js/faker'

import type { CollaboratorRegistrationAttempt } from '../collaborator-registration-attempt'

export class CollaboratorRegistrationAttemptFaker {
  static fake(
    overrides: Partial<CollaboratorRegistrationAttempt> = {},
  ): CollaboratorRegistrationAttempt {
    const createdAt = faker.date.past()
    const status = overrides.status ?? 'pending_auth'

    return {
      id: faker.string.uuid(),
      normalizedEmail: faker.internet.email().toLowerCase(),
      payloadHash: faker.string.hexadecimal({ length: 64, prefix: '' }),
      authUserId:
        status === 'auth_invited' || status === 'completed'
          ? faker.string.uuid()
          : undefined,
      status,
      lastError:
        status === 'reconciliation_required'
          ? 'Estado externo requer reconciliação.'
          : undefined,
      createdAt,
      updatedAt: createdAt,
      ...overrides,
    }
  }

  static fakeMany(count = 10): CollaboratorRegistrationAttempt[] {
    return Array.from({ length: count }, () =>
      CollaboratorRegistrationAttemptFaker.fake(),
    )
  }
}
