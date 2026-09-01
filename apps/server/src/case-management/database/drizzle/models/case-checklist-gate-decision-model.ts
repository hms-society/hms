import { CaseChecklistGateDecision } from '@hms/core/case-management/domain/structures'
import { pgEnum } from 'drizzle-orm/pg-core'

export const caseChecklistGateDecisionModel = pgEnum('case_checklist_gate_decision', [
  CaseChecklistGateDecision.Approved,
  CaseChecklistGateDecision.ApprovedWithException,
  CaseChecklistGateDecision.BlockedInsufficient,
  CaseChecklistGateDecision.RejectedOnMerit,
])
