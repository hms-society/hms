import { faker } from '@faker-js/faker'

import type { CollaboratorCreation } from '../collaborator-creation'
import type { CollaboratorProfile, LegalExpertise } from '../../structures'
import { LegalExpertiseFaker } from '../../structures/fakers'

type CollaboratorCreationOverrides = {
  readonly userId?: string
  readonly professionalName?: string
  readonly jobTitle?: string
  readonly profile?: CollaboratorProfile
  readonly legalExpertises?: readonly LegalExpertise[]
}

const LEGAL_PROFILES: readonly CollaboratorProfile[] = [
  'lawyer',
  'paralegal',
  'supervisor',
]

export class CollaboratorCreationFaker {
  static fake(overrides: CollaboratorCreationOverrides = {}): CollaboratorCreation {
    const profile = overrides.profile ?? 'admin'

    return {
      userId: faker.string.uuid(),
      professionalName: faker.person.fullName(),
      jobTitle: faker.person.jobTitle(),
      profile,
      ...(LEGAL_PROFILES.includes(profile)
        ? { legalExpertises: [LegalExpertiseFaker.fake()] }
        : {}),
      ...overrides,
    } as CollaboratorCreation
  }

  static legal(overrides: CollaboratorCreationOverrides = {}): CollaboratorCreation {
    return CollaboratorCreationFaker.fake({
      profile: 'lawyer',
      legalExpertises: [LegalExpertiseFaker.fake()],
      ...overrides,
    })
  }

  static administrative(
    overrides: CollaboratorCreationOverrides = {},
  ): CollaboratorCreation {
    return CollaboratorCreationFaker.fake({ profile: 'admin', ...overrides })
  }
}
