import type {
  DocumentCreation,
  DocumentPackageCreation,
  DocumentSpecificationCreation,
} from '@hms/core/document-production/domain/entities'
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
      addMany: vi.fn(async (documents: DocumentCreation[]) =>
        documents.map((document) => ({
          ...document,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      ),
    }
    const documentPackagesRepository = {
      add: vi.fn(async (documentPackage: DocumentPackageCreation) => ({
        ...documentPackage,
        createdAt: new Date(),
      })),
    }
    const seeder = new DocumentProductionSeeder(
      { add: vi.fn(), addMany: vi.fn(), removeAll: vi.fn() } as never,
      specificationsRepository as never,
      { add: vi.fn(), removeAll: vi.fn() } as never,
      {
        addMany: vi.fn(async (documents: readonly unknown[]) => documents),
        removeAll: vi.fn(),
      } as never,
      {
        add: vi.fn(async (documentPackage: { id: string }) => documentPackage),
        addMany: vi.fn(async (documents: readonly unknown[]) => documents),
        removeAll: vi.fn(),
      } as never,
      {
        add: vi.fn(),
        addMany: vi.fn(async (documents: readonly unknown[]) => documents),
        removeAll: vi.fn(),
      } as never,
      documentsRepository as never,
      documentPackagesRepository as never,
      {
        addMany: vi.fn(async (documents: readonly unknown[]) => documents),
        removeAll: vi.fn(),
      } as never,
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
      consultationId: '00000000-0000-4000-8000-000000000101',
    })

    const powerOfAttorneyModel = seededSpecifications.find(
      ({ name }) => name === 'Procuração',
    )

    expect(powerOfAttorneyModel).toMatchObject({
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
    expect(JSON.stringify(powerOfAttorneyModel?.content)).toContain('{cliente_nome}')
    expect(seededSpecifications).toHaveLength(3)
    expect(result.specifications).toHaveLength(3)
  })
})
