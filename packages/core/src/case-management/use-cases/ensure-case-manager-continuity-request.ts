import type { CollaboratorProfile, UserStatus } from '#shared/domain/structures'

export type EnsureCaseManagerContinuityRequest = {
  collaboratorId: string
  nextProfile: CollaboratorProfile
  nextStatus: UserStatus
  actorId: string
  operationId: string
}
