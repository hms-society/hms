import type { Entity } from '#shared/domain/entities/entity'
import type { CaseClosureEventType } from '../structures/case-closure-event-type'
import type { CaseClosureOutcome } from '../structures/case-closure-outcome'

export type CaseClosureEvent = Entity & {
  caseId: string
  type: CaseClosureEventType
  actorId: string
  occurredAt: Date
  outcome?: CaseClosureOutcome
  notes?: string
  reason?: string
}
