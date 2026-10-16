import type { CaseClosureOutcome } from './case-closure-outcome'

export type CaseClosureRecord = {
  outcome: CaseClosureOutcome
  notes?: string
  closedBy: string
  closedAt: Date
}
