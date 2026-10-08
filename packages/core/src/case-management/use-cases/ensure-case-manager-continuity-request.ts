import type { CollaboratorProfile, UserStatus } from '#identity/domain/structures'

export type EnsureCaseManagerContinuityRequest = {
  collaboratorId: string
  nextProfile: CollaboratorProfile
  nextStatus: UserStatus
  actorId: string
  operationId: string
}
