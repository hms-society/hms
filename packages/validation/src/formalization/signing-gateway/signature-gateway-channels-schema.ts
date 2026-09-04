import { FormalizationSignatureChannelKind } from '@hms/core/formalization/domain/structures'
import { z } from 'zod'

const signatureGatewayChannelSchema = z.strictObject({
  id: z.string().uuid(),
  kind: z.enum(FormalizationSignatureChannelKind),
  maskedDestination: z.string().min(3).max(320),
})

export const signatureGatewayChannelsSchema = z.union([
  z.tuple([]),
  z.tuple([signatureGatewayChannelSchema]),
])

export type SignatureGatewayChannelsDto = z.infer<typeof signatureGatewayChannelsSchema>
