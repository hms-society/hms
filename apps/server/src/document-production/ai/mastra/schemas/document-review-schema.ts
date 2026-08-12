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

export const documentReviewSchema = z
  .object({
    decision: z.enum(DocumentReviewDecision),
    findings: z.array(documentReviewFindingSchema),
  })
  .superRefine((review, context) => {
    if (
      review.decision === DocumentReviewDecision.Approved &&
      review.findings.length > 0
    ) {
      context.addIssue({
        code: 'custom',
        message: 'An approved review cannot contain findings.',
        path: ['findings'],
      })
    }

    if (
      review.decision === DocumentReviewDecision.ChangesRequired &&
      review.findings.length === 0
    ) {
      context.addIssue({
        code: 'custom',
        message: 'A review requiring changes must contain at least one finding.',
        path: ['findings'],
      })
    }
  })
