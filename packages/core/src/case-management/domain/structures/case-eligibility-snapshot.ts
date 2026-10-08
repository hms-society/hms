import type {
  CollaboratorProfile,
  UserStatus,
} from '@hms/core/identity/domain/structures'

export type CaseEligibilitySnapshot = {
  readonly profile: CollaboratorProfile
  readonly status: UserStatus
}
