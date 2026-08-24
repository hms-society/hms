import { z } from 'zod'

import { caseChecklistGateDecisionSchema } from './case-checklist-gate-decision-schema'

export const reviewCaseChecklistGateSchema = z.object({
  expectedVersion: z.number().int().nonnegative(),
  decision: caseChecklistGateDecisionSchema,
  decidedBy: z.string(),
  remarks: z.string().optional(),
})
