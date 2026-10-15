import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'

export function toSchedulingActor(collaborator: CollaboratorSummary) {
  return {
    collaboratorId: collaborator.collaboratorId,
    profile: collaborator.profile,
    status: collaborator.status,
  }
}
