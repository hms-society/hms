import { z } from 'zod'

import { addressSchema } from './address-schema'
import { consentTypeSchema } from './consent-type-schema'

const taxIdSchema = z.object({
  type: z.enum(['cpf', 'cnpj']),
  value: z.string(),
})

const clientBaseSchema = z.object({
  id: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: addressSchema.optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

const clientSchema = z.discriminatedUnion('type', [
  clientBaseSchema.extend({
    type: z.literal('natural'),
    name: z.string(),
    taxId: taxIdSchema.extend({ type: z.literal('cpf') }),
  }),
  clientBaseSchema.extend({
    type: z.literal('legal'),
    legalName: z.string(),
    tradeName: z.string().optional(),
    taxId: taxIdSchema.extend({ type: z.literal('cnpj') }),
  }),
])

const clientConsentSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  type: consentTypeSchema,
  grantedAt: z.iso.datetime(),
  revokedAt: z.iso.datetime().optional(),
})

export const clientDetailsSchema = z.object({
  client: clientSchema,
  consents: z.array(clientConsentSchema),
})
