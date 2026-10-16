import type { CaseClosureEvent } from '../entities/case-closure-event'
import type { LegalCase } from '../entities/legal-case'
import type { CaseClosureBlocker } from './case-closure-blocker'
import type { CaseClosureRecord } from './case-closure-record'

export type CaseClosureSnapshot = {
  legalCase: LegalCase
  closure?: CaseClosureRecord
  blockers: readonly CaseClosureBlocker[]
  events: readonly CaseClosureEvent[]
}
