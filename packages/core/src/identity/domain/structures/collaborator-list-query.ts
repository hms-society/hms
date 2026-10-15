import type { CollaboratorProfile } from './collaborator-profile'
import type { UserStatus } from './user-status'

export type CollaboratorListQuery = {
  readonly search?: string
  readonly profile?: CollaboratorProfile
  readonly profiles?: readonly CollaboratorProfile[]
  readonly excludeProfiles?: readonly CollaboratorProfile[]
  readonly jobTitle?: string
  readonly status?: UserStatus
  readonly excludeUserId?: string
  readonly excludeCollaboratorIds?: readonly string[]
  readonly nameOnlySearch?: boolean
  readonly page?: number
  readonly limit?: number
  readonly pageSize?: number
}
