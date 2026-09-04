import { z } from 'zod'

const BASE64URL_256_BIT_PATTERN = /^[A-Za-z0-9_-]{43}$/

export const exchangeSignatureInvitationSchema = z
  .strictObject({
    token: z.string().trim().regex(BASE64URL_256_BIT_PATTERN),
  })

export type ExchangeSignatureInvitationInput = z.infer<
  typeof exchangeSignatureInvitationSchema
>
