import type { CollaboratorLegalExpertiseProjection } from '@hms/core/identity/domain/entities'

import type {
  DrizzleCollaborator,
  DrizzleCollaboratorLegalExpertise,
  DrizzleCollaboratorLegalExpertiseTopic,
  DrizzleUser,
} from '@/identity/database/drizzle/types/entities'

export type DrizzleCollaboratorRecord = {
  readonly collaborator: DrizzleCollaborator
  readonly legalExpertises: readonly {
    readonly expertise: DrizzleCollaboratorLegalExpertise
    readonly topics: readonly DrizzleCollaboratorLegalExpertiseTopic[]
  }[]
}

export type DrizzleCollaboratorSummaryRecord = {
  readonly collaborator: DrizzleCollaborator
  readonly user: DrizzleUser
  readonly legalExpertises: readonly CollaboratorLegalExpertiseProjection[]
}
