import type { CaseClosureEvent } from '../domain/entities/case-closure-event'
import type { LegalCase } from '../domain/entities/legal-case'
import type { CaseClosureBlocker } from '../domain/structures/case-closure-blocker'
import type { CaseClosureOutcome } from '../domain/structures/case-closure-outcome'
import type { CaseClosureRecord } from '../domain/structures/case-closure-record'
import type { CaseClosureSnapshot } from '../domain/structures/case-closure-snapshot'

export type CloseCaseParams = {
  caseId: string
  outcome: CaseClosureOutcome
  notes?: string
  actorId: string
  occurredAt: Date
}

export type ReopenCaseParams = {
  caseId: string
  reason: string
  actorId: string
  occurredAt: Date
}

export type CloseCaseResult =
  | {
      kind: 'closed'
      legalCase: LegalCase
      closure: CaseClosureRecord
      event: CaseClosureEvent
    }
  | { kind: 'blocked'; blockers: readonly CaseClosureBlocker[] }
  | { kind: 'conflict' }

export interface CaseClosureRepository {
  getSnapshot(caseId: string): Promise<CaseClosureSnapshot | undefined>
  /** Must re-read blockers and atomically update lifecycle/closure data and append the event. */
  close(params: CloseCaseParams): Promise<CloseCaseResult>
  /** Must atomically transition lifecycle and append a reopening event; previous close data remains intact. */
  reopen(params: ReopenCaseParams): Promise<LegalCase | undefined>
  listEvents(caseId: string): Promise<readonly CaseClosureEvent[]>
}
