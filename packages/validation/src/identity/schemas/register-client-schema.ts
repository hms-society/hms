import { z, type RefinementCtx } from 'zod'

import { addressSchema } from './address-schema'
import { clientTypeSchema } from './client-type-schema'

const optionalText = z
  .string()
  .optional()
  .transform((value) => value?.trim() || undefined)

const optionalAddressSchema = addressSchema
  .partial()
  .superRefine((address, context) => {
    const fields = ['street', 'number', 'district', 'city', 'state', 'zipCode'] as const
    const hasAddress = fields.some((field) => Boolean(address[field]?.trim()))

    if (!hasAddress) return

    for (const field of fields) {
      if (!address[field]?.trim()) {
        context.addIssue({
          code: 'custom',
          path: [field],
          message: 'Preencha todos os campos obrigatórios do endereço.',
        })
      }
    }
  })
  .transform((address) => {
    const fields = ['street', 'number', 'district', 'city', 'state', 'zipCode'] as const
    if (!fields.some((field) => Boolean(address[field]?.trim()))) return undefined

    return {
      street: address.street as string,
      number: address.number as string,
      complement: address.complement,
      district: address.district as string,
      city: address.city as string,
      state: address.state as string,
      zipCode: address.zipCode as string,
    }
  })

const consentDraftSchema = z.object({
  data_processing: z.boolean().default(false),
  whatsapp_communication: z.boolean().default(false),
  email_communication: z.boolean().default(false),
  third_party_sharing: z.boolean().default(false),
})

const registrationFields = {
  type: clientTypeSchema,
  name: optionalText,
  legalName: optionalText,
  tradeName: optionalText,
  taxId: z.string().transform((value) => value.replace(/\D/g, '')),
  phone: optionalText,
  email: z
    .union([z.email(), z.literal('')])
    .optional()
    .transform((value) => value || undefined),
  address: optionalAddressSchema.optional(),
}

const registrationBaseSchema = z.object(registrationFields)
type RegistrationBase = z.output<typeof registrationBaseSchema>

export const registerClientSchema = registrationBaseSchema
  .extend({
    consents: consentDraftSchema.default({
      data_processing: false,
      whatsapp_communication: false,
      email_communication: false,
      third_party_sharing: false,
    }),
  })
  .strict()
  .superRefine(validateRegistration)

export const registerClientRequestSchema = registrationBaseSchema
  .strict()
  .superRefine(validateRegistration)

function validateRegistration(value: RegistrationBase, context: RefinementCtx) {
  const expectedLength = value.type === 'natural' ? 11 : 14
  const validTaxId =
    value.taxId.length === expectedLength &&
    !/^([0-9])\1+$/.test(value.taxId) &&
    isValidCheckDigits(value.taxId)

  if (!validTaxId) {
    context.addIssue({
      code: 'custom',
      path: ['taxId'],
      message: `Informe um ${value.type === 'natural' ? 'CPF' : 'CNPJ'} válido.`,
    })
  }

  if (value.type === 'natural' && !value.name) {
    context.addIssue({
      code: 'custom',
      path: ['name'],
      message: 'Nome completo é obrigatório.',
    })
  }

  if (value.type === 'legal' && !value.legalName) {
    context.addIssue({
      code: 'custom',
      path: ['legalName'],
      message: 'Razão social é obrigatória.',
    })
  }

  if (value.type === 'natural' && (value.legalName || value.tradeName)) {
    context.addIssue({
      code: 'custom',
      path: ['legalName'],
      message: 'Remova os campos de pessoa jurídica.',
    })
  }

  if (value.type === 'legal' && value.name) {
    context.addIssue({
      code: 'custom',
      path: ['name'],
      message: 'Remova o nome de pessoa natural.',
    })
  }
}

function isValidCheckDigits(value: string) {
  const firstWeight = value.length === 11 ? 10 : 5
  const first = calculateCheckDigit(value.slice(0, -2), firstWeight)
  const second = calculateCheckDigit(value.slice(0, -1), firstWeight + 1)

  return first === Number(value.at(-2)) && second === Number(value.at(-1))
}

function calculateCheckDigit(value: string, initialWeight: number) {
  let weight = initialWeight
  const total = value.split('').reduce((sum, digit) => {
    const result = sum + Number(digit) * weight
    weight = weight === 2 ? 9 : weight - 1
    return result
  }, 0)
  const remainder = total % 11
  return remainder < 2 ? 0 : 11 - remainder
}
