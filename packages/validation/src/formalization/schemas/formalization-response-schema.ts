import { z } from 'zod'

import { formalizationIssuesSchema } from './formalization-issue-schema'

export const formalizationDocumentGenerationResponseSchema = z
  .object({
    documentGenerationId: z.uuid(),
    documentId: z.uuid(),
  })
  .strict()

export const formalizationErrorResponseSchema = z
  .object({
    statusCode: z.number().int(),
    title: z.string(),
    message: z.string(),
    timestamp: z.iso.datetime(),
    path: z.string(),
    issues: formalizationIssuesSchema.optional(),
  })
  .strict()

export type FormalizationDocumentGenerationResponse = z.infer<
  typeof formalizationDocumentGenerationResponseSchema
>

export type FormalizationErrorResponse = z.infer<typeof formalizationErrorResponseSchema>
