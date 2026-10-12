import type { Entity } from '#shared/domain/entities/entity'
import type { LegalCase } from './legal-case'

export type CaseCreationOperation = Entity & {
  intakeId: string
  actorId: string
  operationId: string
  fingerprint: string
  result: LegalCase
  createdAt: Date
}
