import { faker } from '@faker-js/faker'

import type { CollaboratorRegistrationAttemptCreation } from '../collaborator-registration-attempt-creation'

export class CollaboratorRegistrationAttemptCreationFaker {
  static fake(
    overrides: Partial<CollaboratorRegistrationAttemptCreation> = {},
  ): CollaboratorRegistrationAttemptCreation {
    return {
      normalizedEmail: faker.internet.email().toLowerCase(),
      payloadHash: faker.string.hexadecimal({ length: 64, prefix: '' }),
      ...overrides,
    }
  }
}
