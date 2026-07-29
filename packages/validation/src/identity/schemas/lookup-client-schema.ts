import { z } from 'zod'

const taxIdSchema = z
  .string()
  .optional()
  .transform((value) => value?.replace(/\D/g, '') || undefined)
  .superRefine((value, context) => {
    if (!value) return

    if (
      ![11, 14].includes(value.length) ||
      /^([0-9])\1+$/.test(value) ||
      !isValidCheckDigits(value)
    ) {
      context.addIssue({ code: 'custom', message: 'Informe um CPF ou CNPJ válido.' })
    }
  })

const phoneSchema = z
  .string()
  .optional()
  .transform((value) => value?.replace(/\D/g, '') || undefined)
  .superRefine((value, context) => {
    if (value === '') {
      context.addIssue({ code: 'custom', message: 'Informe um telefone válido.' })
    }
  })

export const lookupClientSchema = z
  .object({
    taxId: taxIdSchema,
    phone: phoneSchema,
  })
  .superRefine((value, context) => {
    if (!value.taxId && !value.phone) {
      context.addIssue({
        code: 'custom',
        path: ['taxId'],
        message: 'Informe CPF, CNPJ ou telefone para realizar a busca.',
      })
    }
  })

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
