import type { CaseMemberRole } from '../domain/structures'

export type CreateLegalCaseRequest = {
  title: string
  intakeId: string
  legalAreaId: string
  legalTopicId: string
  description?: string
  initialManagerCollaboratorId: string
  team: Array<{ collaboratorId: string; role: CaseMemberRole }>
  operationId: string
  actorId: string
}
