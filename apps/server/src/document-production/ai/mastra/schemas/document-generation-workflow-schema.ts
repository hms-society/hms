import {
  DocumentReviewDecision,
  DocumentReviewFindingCategory,
} from '@hms/core/document-production/domain/structures'
import {
  documentTemplateContentSchema,
  documentTemplateVariableSchema,
} from '@hms/validation/document-production'
import { z } from 'zod'

import { documentDraftSchema } from '@/document-production/ai/mastra/schemas/document-draft-schema'
import { documentReviewSchema } from '@/document-production/ai/mastra/schemas/document-review-schema'

export const documentGenerationSourceSchema = z.object({
  type: z.enum(['consultation', 'formalization', 'case']),
  id: z.string(),
  data: z.record(z.string(), z.unknown()),
})

export const documentGenerationWorkflowInputSchema = z.object({
  documentGenerationId: z.string().uuid(),
  documentId: z.string().uuid(),
  documentSpecificationVersionId: z.string().uuid(),
  requestedByCollaboratorId: z.string().uuid(),
  source: documentGenerationSourceSchema,
})

export const documentPendingMarkerSchema = z.object({
  marker: z.string().regex(/^\{[a-z][a-z0-9_]*\}$/),
})

export const documentReviewCycleInputSchema = z.object({
  documentGenerationId: z.string().uuid(),
  source: documentGenerationSourceSchema,
  template: z.object({
    name: z.string(),
    content: documentTemplateContentSchema,
    variables: z.array(documentTemplateVariableSchema),
  }),
  attemptsCount: z.number().int().min(0).max(3),
  draft: documentDraftSchema.optional(),
  review: documentReviewSchema.optional(),
  pendingMarkers: z.array(documentPendingMarkerSchema).optional(),
})

export const documentReviewCycleOutputSchema = documentReviewCycleInputSchema.extend({
  attemptsCount: z.number().int().min(1).max(3),
  draft: documentDraftSchema,
  review: documentReviewSchema,
  pendingMarkers: z.array(documentPendingMarkerSchema),
})

const approvedOutputSchema = z.object({
  status: z.literal(DocumentReviewDecision.Approved),
  documentGenerationId: z.string().uuid(),
  documentVersionId: z.string().uuid(),
  attemptsCount: z.number().int().min(1).max(3),
  draft: documentDraftSchema,
  pendingMarkers: z.array(documentPendingMarkerSchema),
})

const failedOutputSchema = z.object({
  status: z.literal('failed'),
  documentGenerationId: z.string().uuid(),
  attemptsCount: z.number().int().min(1).max(3),
  findings: z.array(
    z.object({
      category: z.enum(DocumentReviewFindingCategory),
      message: z.string(),
    }),
  ),
})

export const documentGenerationWorkflowOutputSchema = z.discriminatedUnion('status', [
  approvedOutputSchema,
  failedOutputSchema,
])
