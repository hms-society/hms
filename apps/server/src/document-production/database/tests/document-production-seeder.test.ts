import type { DocumentSpecificationCreation } from '@hms/core/document-production/domain/entities'
import { describe, expect, it, vi } from 'vitest'

import { DocumentProductionSeeder } from '@/document-production/database/document-production-seeder'

describe('DocumentProductionSeeder', () => {
  it('seeds the universal retirement model for legal production without adding it to sample packages', async () => {
    let seededSpecifications: readonly DocumentSpecificationCreation[] = []
    let seededDocuments: readonly { id: string; title: string }[] = []
    let seededPackageDocuments: readonly { documentSpecificationId: string }[] = []

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
      addMany: vi.fn(async (documents: { id: string; title: string }[]) => {
        seededDocuments = documents
        return documents
      }),
    }
    const packageDocumentsRepository = {
      addMany: vi.fn(async (packageDocuments: { documentSpecificationId: string }[]) => {
        seededPackageDocuments = packageDocuments
        return packageDocuments.map((packageDocument) => ({
          ...packageDocument,
          id: 'package-document-id',
          documentPackageId: 'package-id',
          documentId: 'document-id',
          createdAt: new Date(),
          updatedAt: new Date(),
        }))
      }),
    }
    const seeder = new DocumentProductionSeeder(
      { add: vi.fn(), replace: vi.fn() } as never,
      specificationsRepository as never,
      { add: vi.fn(), removeAll: vi.fn() } as never,
      documentsRepository as never,
      {
        add: vi.fn(async (documentPackage: { id: string }) => documentPackage),
        removeAll: vi.fn(),
      } as never,
      packageDocumentsRepository as never,
      { save: vi.fn() } as never,
    )

    await seeder.run({
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
    expect(seededDocuments).toHaveLength(3)
    expect(seededPackageDocuments).toHaveLength(3)
  })
})
