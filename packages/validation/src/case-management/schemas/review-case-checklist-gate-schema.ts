import { z } from 'zod'

import { caseChecklistGateDecisionSchema } from './case-checklist-gate-decision-schema'

export const reviewCaseChecklistGateSchema = z.object({
  decision: caseChecklistGateDecisionSchema,
  remarks: z.string().optional(),
})
