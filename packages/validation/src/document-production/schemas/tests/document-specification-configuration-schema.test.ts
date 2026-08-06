import { describe, expect, it } from 'vitest'

import {
  createDocumentSpecificationSchema,
  documentSpecificationConfigurationUpdateSchema,
} from '..'

const globalApplication = { scope: 'global', moment: 'consultation' }
const legalApplication = {
  scope: 'legal_context',
  moment: 'legal_production',
  legalAreaIds: ['00000000-0000-4000-8000-000000000001'],
  legalTopicIdsByArea: {
    '00000000-0000-4000-8000-000000000001': ['00000000-0000-4000-8000-000000000002'],
  },
}

describe('Document Specification Configuration Schemas', () => {
  it('accepts create and configuration update payloads', () => {
    expect(
      createDocumentSpecificationSchema.parse({
        name: '  Procuração  ',
        description: '  Descrição  ',
        application: globalApplication,
        isRequired: true,
      }),
    ).toMatchObject({ name: 'Procuração', description: 'Descrição' })
    expect(
      documentSpecificationConfigurationUpdateSchema.parse({
        name: 'Modelo',
        description: 'Descrição',
        application: legalApplication,
        isRequired: false,
        status: 'unavailable',
      }),
    ).toBeTruthy()
  })

  it('rejects fields outside each application scope and invalid payload extras', () => {
    expect(
      createDocumentSpecificationSchema.safeParse({
        name: 'Modelo',
        description: 'Descrição',
        application: { ...globalApplication, legalAreaIds: [] },
        isRequired: false,
      }).success,
    ).toBe(false)
    expect(
      documentSpecificationConfigurationUpdateSchema.safeParse({
        name: 'Modelo',
        description: 'Descrição',
        application: { ...legalApplication, legalTopicIdsByArea: {} },
        isRequired: false,
        status: 'available',
      }).success,
    ).toBe(false)
    expect(
      createDocumentSpecificationSchema.safeParse({
        name: 'Modelo',
        description: 'Descrição',
        application: globalApplication,
        isRequired: false,
        status: 'unavailable',
      }).success,
    ).toBe(false)
  })
})
