import type {
  CollaboratorProfile,
  UserStatus,
} from '@hms/core/identity/domain/structures'

export type CaseEligibleCollaborator = {
  collaboratorId: string
  professionalName: string
  email: string
  profile: CollaboratorProfile
  status: UserStatus
}
