import { z } from 'zod'
import { addressSchema } from './address-schema'

const taxIdSchema = z.object({
  type: z.enum(['cpf', 'cnpj']),
  value: z.string(),
})

export const updateClientSchema = z.object({
  type: z.enum(['natural', 'legal']).optional(),
  name: z.string().optional(),
  legalName: z.string().optional(),
  tradeName: z.string().optional(),
  taxId: taxIdSchema.optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: addressSchema.optional(),
  duplicityOverrideJustification: z.string().optional(),
})
