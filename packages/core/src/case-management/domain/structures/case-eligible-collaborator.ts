import type { CollaboratorProfile, UserStatus } from '@hms/core/shared/domain/structures'

export type CaseEligibleCollaborator = {
  collaboratorId: string
  professionalName: string
  email: string
  profile: CollaboratorProfile
  status: UserStatus
}
