import { describe, expect, it } from 'vitest'

import { grantClientConsentSchema, lookupClientSchema, registerClientSchema } from '..'

const cpf = '52998224725'
const cnpj = '11222333000181'
const consents = {
  whatsapp_communication: true,
  email_communication: false,
  third_party_sharing: false,
}

describe('Identity schemas', () => {
  it('normalizes masked lookup criteria and requires one criterion', () => {
    expect(
      lookupClientSchema.parse({
        taxId: '529.982.247-25',
        phone: '(11) 99999-9999',
      }),
    ).toEqual({ taxId: cpf, phone: '11999999999' })
    expect(lookupClientSchema.safeParse({}).success).toBe(false)
    expect(lookupClientSchema.safeParse({ taxId: '111.111.111-11' }).success).toBe(false)
  })

  it('accepts natural and legal registration drafts', () => {
    expect(
      registerClientSchema.parse({
        type: 'natural',
        name: 'Maria Aparecida',
        taxId: '529.982.247-25',
        phone: '+55 (11) 99999-9999',
        consents,
      }),
    ).toMatchObject({ type: 'natural', name: 'Maria Aparecida', taxId: cpf })

    expect(
      registerClientSchema.parse({
        type: 'legal',
        legalName: 'Empresa SJC',
        taxId: '11.222.333/0001-81',
        email: 'contato@empresa.com',
        consents,
      }),
    ).toMatchObject({ type: 'legal', legalName: 'Empresa SJC', taxId: cnpj })

    expect(
      registerClientSchema.parse({
        type: 'natural',
        name: 'Maria Aparecida',
        taxId: '529.982.247-25',
        phone: '11999999999',
        consents,
      }).phone,
    ).toBe('5511999999999')
  })

  it('rejects incompatible fields, invalid contact data, and partial addresses', () => {
    expect(
      registerClientSchema.safeParse({
        type: 'natural',
        name: 'Maria',
        taxId: cpf,
        consents,
      }).success,
    ).toBe(false)
    expect(
      registerClientSchema.safeParse({
        type: 'natural',
        name: 'Maria',
        taxId: cpf,
        phone: '+55 (11) 99999-9999',
        consents: {
          whatsapp_communication: false,
          email_communication: false,
          third_party_sharing: true,
        },
      }),
    ).toMatchObject({
      success: false,
      error: {
        issues: [
          expect.objectContaining({
            path: ['consents'],
            message: 'Selecione pelo menos uma forma de comunicação: WhatsApp ou e-mail.',
          }),
        ],
      },
    })
    expect(
      registerClientSchema.safeParse({
        type: 'natural',
        name: 'Maria',
        legalName: 'Empresa',
        taxId: cpf,
        consents,
      }).success,
    ).toBe(false)
    expect(
      registerClientSchema.safeParse({
        type: 'natural',
        name: 'Maria',
        taxId: cpf,
        email: 'not-an-email',
        consents,
      }).success,
    ).toBe(false)
    expect(
      registerClientSchema.safeParse({
        type: 'natural',
        name: 'Maria',
        taxId: cpf,
        address: { street: 'Rua A' },
        consents,
      }).success,
    ).toBe(false)
    expect(
      registerClientSchema.safeParse({
        type: 'natural',
        name: 'Maria',
        taxId: cpf,
        consents: ['whatsapp_communication'],
      }).success,
    ).toBe(false)
  })

  it('accepts a complete address and rejects extra consent grant fields', () => {
    expect(
      registerClientSchema.parse({
        type: 'natural',
        name: 'Maria',
        taxId: cpf,
        email: 'maria@example.com',
        address: {
          street: 'Rua A',
          number: '10',
          district: 'Centro',
          city: 'São José',
          state: 'SP',
          zipCode: '12200000',
        },
        consents,
      }).address,
    ).toMatchObject({ street: 'Rua A', number: '10' })

    expect(grantClientConsentSchema.parse({ type: 'data_processing' })).toEqual({
      type: 'data_processing',
    })
    expect(
      grantClientConsentSchema.safeParse({
        type: 'data_processing',
        extra: true,
      }).success,
    ).toBe(false)
  })
})
