import type { CollaboratorProfile, UserStatus } from '@hms/core/shared/domain/structures'

export type CaseEligibilitySnapshot = {
  readonly profile: CollaboratorProfile
  readonly status: UserStatus
}
