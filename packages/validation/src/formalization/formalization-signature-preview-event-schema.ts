import { z } from 'zod'

export const formalizationSignaturePreviewEventSchema = z
  .object({
    previewId: z.uuid(),
    formalizationId: z.uuid(),
    attemptToken: z.uuid(),
    occurredAt: z.iso.datetime(),
  })
  .strict()

export type FormalizationSignaturePreviewEvent = z.infer<
  typeof formalizationSignaturePreviewEventSchema
>
