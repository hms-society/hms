import { faker } from '@faker-js/faker'

import type { TaxId } from '../tax-id'

export class TaxIdFaker {
  static cpf(overrides: Partial<TaxId<'cpf'>> = {}): TaxId<'cpf'> {
    return { type: 'cpf', value: generateTaxId(11), ...overrides }
  }

  static cnpj(overrides: Partial<TaxId<'cnpj'>> = {}): TaxId<'cnpj'> {
    return { type: 'cnpj', value: generateTaxId(14), ...overrides }
  }
}

function generateTaxId(length: 11 | 14) {
  const baseLength = length - 2
  const firstWeight = length === 11 ? 10 : 5

  let value: string

  do {
    const base = faker.string.numeric(baseLength)
    const firstCheckDigit = calculateCheckDigit(base, firstWeight)
    const secondCheckDigit = calculateCheckDigit(
      `${base}${firstCheckDigit}`,
      firstWeight + 1,
    )

    value = `${base}${firstCheckDigit}${secondCheckDigit}`
  } while (/^([0-9])\1+$/.test(value))

  return value
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
