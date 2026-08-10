import { describe, expect, it } from 'vitest'

import { documentTemplateVariableSchema } from '..'

describe('Document Template Variable Schema', () => {
  it('trims fields and normalizes an empty description to undefined', () => {
    expect(
      documentTemplateVariableSchema.parse({
        label: '  Cliente  ',
        technicalName: ' cliente_nome ',
        description: '  ',
      }),
    ).toEqual({ label: 'Cliente', technicalName: 'cliente_nome', description: undefined })
  })

  it('rejects invalid names and extra fields', () => {
    expect(
      documentTemplateVariableSchema.safeParse({ label: 'x', technicalName: '1_name' })
        .success,
    ).toBe(false)
    expect(
      documentTemplateVariableSchema.safeParse({
        label: 'x',
        technicalName: 'name-value',
      }).success,
    ).toBe(false)
    expect(
      documentTemplateVariableSchema.safeParse({
        label: 'x',
        technicalName: 'name',
        extra: true,
      }).success,
    ).toBe(false)
  })

  it('accepts repeated and trailing underscores in snake_case names', () => {
    expect(
      documentTemplateVariableSchema.safeParse({
        label: 'Campo',
        technicalName: 'campo__extra_',
      }).success,
    ).toBe(true)
  })
})
