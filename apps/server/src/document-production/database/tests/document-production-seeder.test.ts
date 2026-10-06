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
    const documentsRepository = {
      addMany: vi.fn(async (documents) =>
        documents.map((document, index) => ({ ...document, id: `document-${index}` })),
      ),
    }
    const documentPackagesRepository = {
      add: vi.fn(async (documentPackage) => documentPackage),
    }
    const packageDocumentsRepository = {
      addMany: vi.fn(async (packageDocuments) => packageDocuments),
    }

    const seeder = new DocumentProductionSeeder(
      {} as never,
      specificationsRepository as never,
      {} as never,
      documentsRepository as never,
      documentPackagesRepository as never,
      packageDocumentsRepository as never,
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
      consultationId: 'consultation-id',
    })

    const model = seededSpecifications.find(({ name }) => name === 'Procuração')

    expect(model).toMatchObject({
      application: {
        scope: 'legal_context',
        moment: 'consultation',
        legalAreaIds: ['civil-area'],
        legalTopicIdsByArea: { 'civil-area': ['contracts-topic'] },
      },
      variables: expect.arrayContaining([
        expect.objectContaining({
          label: 'Nome do cliente',
          technicalName: 'cliente_nome',
        }),
      ]),
    })
    expect(JSON.stringify(model?.content)).toContain('{cliente_nome}')
    expect(seededSpecifications).toHaveLength(3)
    expect(result.specifications).toHaveLength(3)
  })
})
