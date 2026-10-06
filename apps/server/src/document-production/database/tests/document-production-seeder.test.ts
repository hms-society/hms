import type { DocumentSpecificationCreation } from '@hms/core/document-production/domain/entities'
import { describe, expect, it, vi } from 'vitest'

import { DocumentProductionSeeder } from '@/document-production/database/document-production-seeder'

describe('DocumentProductionSeeder', () => {
  it('seeds available document models without creating file-backed sample pieces', async () => {
    let seededSpecifications: readonly DocumentSpecificationCreation[] = []

    const specificationsRepository = {
      addMany: vi.fn(async (specifications: DocumentSpecificationCreation[]) => {
        seededSpecifications = specifications
        return specifications.map((specification, index) => ({
          ...specification,
          id: `specification-${index}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        }))
      }),
    }
    const seeder = new DocumentProductionSeeder(
      { add: vi.fn(), replace: vi.fn() } as never,
      specificationsRepository as never,
      { add: vi.fn(), removeAll: vi.fn() } as never,
      { addMany: vi.fn(), removeAll: vi.fn() } as never,
      { add: vi.fn(), addMany: vi.fn(), removeAll: vi.fn() } as never,
      { add: vi.fn(), addMany: vi.fn(), removeAll: vi.fn() } as never,
    )

    const result = await seeder.run({
      legalAreas: [
        { id: 'civil-area', name: 'Cível' },
        { id: 'previdenciary-area', name: 'Previdenciário' },
      ],
      legalTopics: [
        { id: 'contracts-topic', legalAreaId: 'civil-area', name: 'Contratos' },
        {
          id: 'retirement-topic',
          legalAreaId: 'previdenciary-area',
          name: 'Aposentadoria',
        },
      ],
    })

    const universalModel = seededSpecifications.find(
      ({ name }) =>
        name === 'Requerimento Administrativo de Aposentadoria — Modelo Universal',
    )

    expect(universalModel).toMatchObject({
      application: {
        scope: 'legal_context',
        moment: 'legal_production',
        legalAreaIds: ['previdenciary-area'],
        legalTopicIdsByArea: { 'previdenciary-area': ['retirement-topic'] },
      },
      variables: expect.arrayContaining([
        expect.objectContaining({
          label: 'Nome do requerente',
          technicalName: 'nome_requerente',
        }),
      ]),
    })
    expect(JSON.stringify(universalModel?.content)).toContain('{{nome_requerente}}')
    expect(seededSpecifications).toHaveLength(4)
    expect(result.specifications).toHaveLength(4)
  })
})
