import type { CaseChecklistGateDecision } from './case-checklist-gate-decision'

export type CaseChecklistGate = {
  decision?: CaseChecklistGateDecision
  decidedAt?: Date
  decidedBy?: string
  remarks?: string
}
