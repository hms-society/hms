import { CaseChecklistGateDecision } from '@hms/core/case-management/domain/structures'
import { z } from 'zod'

export const caseChecklistGateDecisionSchema = z.enum(CaseChecklistGateDecision)
