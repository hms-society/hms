import { z } from 'zod'

export const signatureGatewayDocumentMetadataSchema = z.strictObject({
  privateFileId: z.string().uuid(),
  title: z.string().min(1).max(255),
  mediaType: z.literal('application/pdf'),
  byteCount: z.number().int().positive(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
})

export type SignatureGatewayDocumentMetadataDto = z.infer<
  typeof signatureGatewayDocumentMetadataSchema
>
