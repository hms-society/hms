import { z } from 'zod'

export const signatureGatewayDocumentSchema = z.strictObject({
  id: z.string().uuid(),
  title: z.string().min(1).max(255),
  position: z.number().int().nonnegative(),
  pageCount: z.number().int().positive().optional(),
})

export type SignatureGatewayDocumentDto = z.infer<
  typeof signatureGatewayDocumentSchema
>
