import { z } from 'zod'

const isoDatetimeSchema = z.string().datetime({ offset: true })

export const acknowledgeSignatureDocumentSchema = z
  .object({
    expectedRequestVersion: z.number().int().positive(),
    acknowledged: z.literal(true),
  })
  .strict()

export const signatureDocumentAcknowledgementSchema = z
  .object({
    requestDocumentId: z.string().uuid(),
    acknowledgedAt: isoDatetimeSchema,
  })
  .strict()

export type AcknowledgeSignatureDocumentInput = z.infer<
  typeof acknowledgeSignatureDocumentSchema
>

export type SignatureDocumentAcknowledgementDto = z.infer<
  typeof signatureDocumentAcknowledgementSchema
>
