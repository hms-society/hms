import { z } from 'zod'

import { signatureGatewayDocumentSchema } from './signature-gateway-document-schema'

export const signatureGatewayDocumentsSchema = z
  .object({
    documents: z.array(signatureGatewayDocumentSchema).min(1).readonly(),
    acknowledgedDocumentIds: z.array(z.string().uuid()).readonly(),
    requestVersion: z.number().int().positive(),
  })
  .strict()

export type SignatureGatewayDocumentsDto = z.infer<
  typeof signatureGatewayDocumentsSchema
>
