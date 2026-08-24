import { z } from 'zod'

import { caseChecklistGateDecisionSchema } from './case-checklist-gate-decision-schema'
import { legalCaseStatusSchema } from './legal-case-status-schema'

export const legalCaseSchema = z.object({
  id: z.string(),
  publicCode: z.string(),
  clientId: z.string(),
  intakeId: z.string(),
  legalAreaId: z.string(),
  legalTopicId: z.string(),
  title: z.string(),
  status: legalCaseStatusSchema,
  checklistGate: z.object({
    decision: caseChecklistGateDecisionSchema.optional(),
    decidedAt: z.iso.datetime().optional(),
    decidedBy: z.string().optional(),
    remarks: z.string().optional(),
  }),
  dossierGate: z.object({
    homologatedAt: z.iso.datetime().optional(),
    homologatedBy: z.string().optional(),
  }),
  openedAt: z.iso.datetime(),
  version: z.number().int(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})
