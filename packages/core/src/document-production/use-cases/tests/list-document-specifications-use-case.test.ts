import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import type { LegalExpertiseCatalogProvider } from '#legal-catalog/interfaces'
import type { PaginationResponse } from '#shared/responses/pagination-response.ts'
import type { DocumentSpecificationsRepository } from '../../interfaces'
import type {
  DocumentSpecificationListItem,
  DocumentSpecificationListRecord,
} from '../../domain/structures'
import { ListDocumentSpecificationsUseCase } from '../list-document-specifications-use-case'

describe('List Document Specifications Use Case', () => {
  let repository: MockProxy<DocumentSpecificationsRepository>
  let legalExpertiseCatalogProvider: MockProxy<LegalExpertiseCatalogProvider>

  beforeEach(() => {
    repository = mock<DocumentSpecificationsRepository>()
    legalExpertiseCatalogProvider = mock<LegalExpertiseCatalogProvider>()
  })

  it('normalizes the query and resolves legal context names', async () => {
    const record: DocumentSpecificationListRecord = {
      documentSpecificationId: 'spec-1',
      name: 'Procuração',
      description: 'Modelo de procuração',
      application: {
        scope: 'legal_context',
        moment: 'legal_production',
        legalAreaIds: ['area-1'],
        legalTopicIdsByArea: { 'area-1': ['topic-1'] },
      },
      status: 'available',
      accessClassification: 'Interno',
    }
    const page: PaginationResponse<DocumentSpecificationListRecord> = {
      items: [record],
      page: 1,
      pageSize: 20,
      total: 1,
      totalPages: 1,
    }
    repository.list.mockResolvedValue(page)
    legalExpertiseCatalogProvider.resolve.mockResolvedValue([
      {
        legalArea: { id: 'area-1', name: 'Cível', active: true },
        legalTopics: [{ id: 'topic-1', name: 'Contratos', active: true }],
      },
    ])

    const useCase = new ListDocumentSpecificationsUseCase(
      repository,
      legalExpertiseCatalogProvider,
    )

    await expect(
      useCase.execute({
        query: {
          search: '  procuração  ',
          legalAreaId: '  area-1 ',
          legalTopicId: ' topic-1 ',
          page: 0,
          pageSize: 101,
        },
      }),
    ).resolves.toEqual({
      ...page,
      items: [
        {
          documentSpecificationId: 'spec-1',
          name: 'Procuração',
          description: 'Modelo de procuração',
          application: {
            scope: 'legal_context',
            moment: 'legal_production',
            legalExpertises: [
              {
                legalAreaId: 'area-1',
                legalAreaName: 'Cível',
                legalTopics: [{ legalTopicId: 'topic-1', legalTopicName: 'Contratos' }],
              },
            ],
          },
          status: 'available',
          accessClassification: 'Interno',
        },
      ],
    })

    expect(repository.list).toHaveBeenCalledWith({
      search: 'procuração',
      legalAreaId: 'area-1',
      legalTopicId: 'topic-1',
      page: 1,
      pageSize: 100,
    })
    expect(legalExpertiseCatalogProvider.resolve).toHaveBeenCalledWith([
      { legalAreaId: 'area-1', legalTopicIds: ['topic-1'] },
    ])
  })

  it('does not resolve the catalog for global applications and preserves empty pages', async () => {
    const page: PaginationResponse<DocumentSpecificationListRecord> = {
      items: [
        {
          documentSpecificationId: 'spec-2',
          name: 'Contrato',
          description: 'Modelo global',
          application: {
            scope: 'global',
            moment: 'formalization',
          },
          status: 'unavailable',
          accessClassification: 'Interno',
        },
      ],
      page: 8,
      pageSize: 20,
      total: 1,
      totalPages: 1,
    }
    repository.list.mockResolvedValue(page)

    const useCase = new ListDocumentSpecificationsUseCase(
      repository,
      legalExpertiseCatalogProvider,
    )

    await expect(useCase.execute({ query: { page: 8 } })).resolves.toEqual({
      ...page,
      items: [
        {
          documentSpecificationId: 'spec-2',
          name: 'Contrato',
          description: 'Modelo global',
          application: { scope: 'global', moment: 'formalization' },
          status: 'unavailable',
          accessClassification: 'Interno',
        },
      ] satisfies readonly DocumentSpecificationListItem[],
    })

    expect(legalExpertiseCatalogProvider.resolve).not.toHaveBeenCalled()
    expect(repository.list).toHaveBeenCalledWith({ page: 8, pageSize: 20 })
  })
})