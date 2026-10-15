import type { Entity } from '#shared/domain/entities/entity'
import type { CaseTeamMutationResult } from '../structures'

export type CaseTeamOperation = Entity & {
  caseId: string
  actorId: string
  operationId: string
  fingerprint: string
  result: CaseTeamMutationResult
  createdAt: Date
}
