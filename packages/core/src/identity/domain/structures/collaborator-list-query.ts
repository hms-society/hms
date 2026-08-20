import type { CollaboratorProfile } from './collaborator-profile'
import type { UserStatus } from './user-status'

export type CollaboratorListQuery = {
  readonly search?: string
  readonly profile?: CollaboratorProfile
  readonly jobTitle?: string
  readonly status?: UserStatus
  readonly excludeUserId?: string
  readonly page?: number
  readonly limit?: number
  readonly pageSize?: number
}
