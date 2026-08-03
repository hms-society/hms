import { faker } from '@faker-js/faker'

import type { CollaboratorSummary } from '../collaborator-summary'
import { CollaboratorLegalExpertiseProjectionFaker } from './collaborator-legal-expertise-projection-faker'
import type { CollaboratorProfile, UserStatus } from '../../structures'
import type { CollaboratorLegalExpertiseProjection } from '../collaborator-legal-expertise-projection'

type CollaboratorSummaryOverrides = {
  readonly collaboratorId?: string
  readonly professionalName?: string
  readonly email?: string
  readonly profile?: CollaboratorProfile
  readonly jobTitle?: string
  readonly status?: UserStatus
  readonly lastAccessAt?: Date
  readonly legalExpertises?: readonly CollaboratorLegalExpertiseProjection[]
}

const LEGAL_PROFILES: readonly CollaboratorProfile[] = [
  'lawyer',
  'paralegal',
  'supervisor',
]

export class CollaboratorSummaryFaker {
  static fake(overrides: CollaboratorSummaryOverrides = {}): CollaboratorSummary {
    const profile = overrides.profile ?? 'admin'

    return {
      collaboratorId: faker.string.uuid(),
      professionalName: faker.person.fullName(),
      email: faker.internet.email(),
      profile,
      jobTitle: faker.person.jobTitle(),
      status: 'active',
      lastAccessAt: faker.date.recent(),
      ...(LEGAL_PROFILES.includes(profile)
        ? { legalExpertises: [CollaboratorLegalExpertiseProjectionFaker.fake()] }
        : {}),
      ...overrides,
    } as CollaboratorSummary
  }

  static legal(overrides: CollaboratorSummaryOverrides = {}): CollaboratorSummary {
    return CollaboratorSummaryFaker.fake({
      profile: 'lawyer',
      legalExpertises: [CollaboratorLegalExpertiseProjectionFaker.fake()],
      ...overrides,
    })
  }

  static fakeMany(count = 10): CollaboratorSummary[] {
    return Array.from({ length: count }, () => CollaboratorSummaryFaker.fake())
  }
}
