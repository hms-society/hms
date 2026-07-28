import { describe, expect, it } from 'vitest'

import { TaxIdFaker } from '../tax-id-faker'

describe('TaxIdFaker', () => {
  it.each([
    ['CPF', () => TaxIdFaker.cpf().value, 11],
    ['CNPJ', () => TaxIdFaker.cnpj().value, 14],
  ])('generates a valid %s', (_, generateTaxId, expectedLength) => {
    const value = generateTaxId()

    expect(value).toHaveLength(expectedLength)
    expect(value).toMatch(/^[0-9]+$/)
    expect(hasValidCheckDigits(value)).toBe(true)
    expect(/^([0-9])\1+$/.test(value)).toBe(false)
  })
})

function hasValidCheckDigits(value: string) {
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
