import { faker } from '@faker-js/faker'

import type { Collaborator } from '../collaborator'
import { LegalExpertiseFaker } from '../../structures/fakers'
import type { CollaboratorProfile, LegalExpertise } from '../../structures'

type CollaboratorOverrides = {
  readonly id?: string
  readonly userId?: string
  readonly professionalName?: string
  readonly jobTitle?: string
  readonly profile?: CollaboratorProfile
  readonly legalExpertises?: readonly LegalExpertise[]
  readonly createdAt?: Date
  readonly updatedAt?: Date
}

const LEGAL_PROFILES: readonly CollaboratorProfile[] = [
  'lawyer',
  'paralegal',
  'supervisor',
]

export class CollaboratorFaker {
  static fake(overrides: CollaboratorOverrides = {}): Collaborator {
    const profile = overrides.profile ?? 'admin'

    return {
      id: faker.string.uuid(),
      userId: faker.string.uuid(),
      professionalName: faker.person.fullName(),
      jobTitle: faker.person.jobTitle(),
      profile,
      ...(LEGAL_PROFILES.includes(profile)
        ? { legalExpertises: [LegalExpertiseFaker.fake()] }
        : {}),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides,
    } as Collaborator
  }

  static legal(overrides: CollaboratorOverrides = {}): Collaborator {
    return CollaboratorFaker.fake({
      profile: 'lawyer',
      legalExpertises: [LegalExpertiseFaker.fake()],
      ...overrides,
    })
  }

  static administrative(overrides: CollaboratorOverrides = {}): Collaborator {
    return CollaboratorFaker.fake({ profile: 'admin', ...overrides })
  }

  static fakeMany(count = 10): Collaborator[] {
    return Array.from({ length: count }, () => CollaboratorFaker.fake())
  }
}
