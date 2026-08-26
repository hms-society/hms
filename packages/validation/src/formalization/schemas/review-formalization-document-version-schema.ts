import { DocumentVersionStatus } from '@hms/core/document-production/domain/structures'
import { z } from 'zod'

const formalizationReviewStatusSchema = z.enum([
  DocumentVersionStatus.Approved,
  DocumentVersionStatus.Rejected,
])

export const reviewFormalizationDocumentVersionSchema = z
  .object({
    status: formalizationReviewStatusSchema,
    rejectionReason: z.string().trim().min(1).optional(),
  })
  .strict()

export type ReviewFormalizationDocumentVersionInput = z.infer<
  typeof reviewFormalizationDocumentVersionSchema
>
