import {
  DocumentReviewDecision,
  DocumentReviewFindingCategory,
} from '@hms/core/document-production/domain/structures'
import { z } from 'zod'

export const documentReviewFindingSchema = z.object({
  category: z.enum(DocumentReviewFindingCategory),
  description: z.string().trim().min(1),
  correction: z.string().trim().min(1),
})

export const documentReviewSchema = z.discriminatedUnion('decision', [
  z.object({
    decision: z.literal(DocumentReviewDecision.Approved),
    findings: z.array(documentReviewFindingSchema).length(0),
  }),
  z.object({
    decision: z.literal(DocumentReviewDecision.ChangesRequired),
    findings: z.array(documentReviewFindingSchema).min(1),
  }),
])
