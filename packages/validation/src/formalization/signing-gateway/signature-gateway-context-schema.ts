import {
  FormalizationSignatureChannelKind,
  FormalizationSignaturePendingResultStatus,
  FormalizationSignatureResultStatus,
  FormalizationSignatureUnavailableReason,
} from '@hms/core/formalization/domain/structures'
import { z } from 'zod'

import { signatureGatewayDocumentSchema } from './signature-gateway-document-schema'
import { signatureResultSchema } from './signature-result-schema'

const uuidSchema = z.string().uuid()
const isoDatetimeSchema = z.string().datetime({ offset: true })
const BASE64URL_256_BIT_PATTERN = /^[A-Za-z0-9_-]{43}$/
const contextCsrfShape = {
  csrfToken: z.string().regex(BASE64URL_256_BIT_PATTERN),
}
const channelSchema = z
  .object({
    id: uuidSchema,
    kind: z.enum(FormalizationSignatureChannelKind),
    maskedDestination: z.string().min(3).max(320),
  })
  .strict()

export const signatureGatewayContextSchema = z.discriminatedUnion('step', [
  z.strictObject({
    ...contextCsrfShape,
    step: z.literal('invitation'),
  }),
  z.strictObject({
    ...contextCsrfShape,
    step: z.literal('choose_channel'),
    channels: z.union([z.tuple([]), z.tuple([channelSchema])]),
  }),
  z.strictObject({
    ...contextCsrfShape,
    step: z.literal('enter_otp'),
    challengeId: uuidSchema,
    expiresAt: isoDatetimeSchema,
    resendAvailableAt: isoDatetimeSchema,
  }),
  z.strictObject({
    ...contextCsrfShape,
    step: z.literal('collaborator_login'),
    loginPath: z.string().startsWith('/login?returnTo='),
  }),
  z.strictObject({
    ...contextCsrfShape,
    step: z.literal('reading'),
    documents: z.array(signatureGatewayDocumentSchema).min(1).readonly(),
    acknowledgedDocumentIds: z.array(uuidSchema).readonly(),
    requestVersion: z.number().int().positive(),
  }),
  z.strictObject({
    ...contextCsrfShape,
    step: z.literal('submitted'),
    result: signatureResultSchema.extend({
      status: z.enum(FormalizationSignaturePendingResultStatus),
    }),
  }),
  z.strictObject({
    ...contextCsrfShape,
    step: z.literal('confirmed'),
    result: signatureResultSchema.extend({
      status: z.literal(FormalizationSignatureResultStatus.confirmed),
      protocol: z.string().min(1).max(128),
    }),
  }),
  z.strictObject({
    step: z.literal('unavailable'),
    csrfToken: contextCsrfShape.csrfToken.optional(),
    reason: z.enum(FormalizationSignatureUnavailableReason),
    result: signatureResultSchema.optional(),
    retryAt: isoDatetimeSchema.optional(),
  }),
])

export type SignatureGatewayContextDto = z.infer<typeof signatureGatewayContextSchema>
