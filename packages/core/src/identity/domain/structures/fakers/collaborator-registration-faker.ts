import { faker } from '@faker-js/faker'

import type { CollaboratorRegistration } from '../collaborator-registration'
import type { CollaboratorProfile } from '../collaborator-profile'
import type { LegalExpertise } from '../legal-expertise'
import { LegalExpertiseFaker } from './legal-expertise-faker'

type CollaboratorRegistrationOverrides = {
  readonly email?: string
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

export class CollaboratorRegistrationFaker {
  static fake(
    overrides: CollaboratorRegistrationOverrides = {},
  ): CollaboratorRegistration {
    const profile = overrides.profile ?? 'admin'

    return {
      email: faker.internet.email(),
      professionalName: faker.person.fullName(),
      jobTitle: faker.person.jobTitle(),
      profile,
      ...(LEGAL_PROFILES.includes(profile)
        ? { legalExpertises: [LegalExpertiseFaker.fake()] }
        : {}),
      ...overrides,
    } as CollaboratorRegistration
  }

  static legal(
    overrides: CollaboratorRegistrationOverrides = {},
  ): CollaboratorRegistration {
    return CollaboratorRegistrationFaker.fake({
      profile: 'lawyer',
      legalExpertises: [LegalExpertiseFaker.fake()],
      ...overrides,
    })
  }

  static administrative(
    overrides: CollaboratorRegistrationOverrides = {},
  ): CollaboratorRegistration {
    return CollaboratorRegistrationFaker.fake({ profile: 'admin', ...overrides })
  }
}
