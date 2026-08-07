import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import type { LegalExpertiseCatalogProvider } from '#legal-catalog/interfaces'
import { fakeDocumentSpecification } from '../../domain/entities/fakers'
import {
  DocumentSpecificationNotFoundError,
  InvalidDocumentSpecificationConfigurationError,
  InvalidDocumentTemplateError,
} from '../../domain/errors'
import type { DocumentTemplateContent } from '../../domain/structures'
import type { DocumentSpecificationsRepository } from '../../interfaces'
import { UpdateDocumentSpecificationConfigurationUseCase } from '../update-document-specification-configuration-use-case'

describe('Update Document Specification Configuration Use Case', () => {
  let repository: MockProxy<DocumentSpecificationsRepository>
  let catalogProvider: MockProxy<LegalExpertiseCatalogProvider>

  beforeEach(() => {
    repository = mock<DocumentSpecificationsRepository>()
    catalogProvider = mock<LegalExpertiseCatalogProvider>()
    catalogProvider.validateActive.mockResolvedValue(true)
  })

  it('updates only configuration and keeps an available template valid', async () => {
    const specification = fakeDocumentSpecification({
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Olá {{cliente_nome}}' }],
          },
        ],
      } as unknown as DocumentTemplateContent,
      status: 'unavailable',
    })
    repository.findById.mockResolvedValue(specification)
    repository.replaceConfiguration.mockResolvedValue({
      ...specification,
      status: 'available',
    })

    await new UpdateDocumentSpecificationConfigurationUseCase(
      repository,
      catalogProvider,
    ).execute({
      documentSpecificationId: specification.id,
      changes: {
        name: '  Novo nome ',
        description: ' Nova descrição ',
        status: 'available',
        application: specification.application,
        isRequired: true,
      },
    })

    expect(repository.replaceConfiguration).toHaveBeenCalledWith(specification.id, {
      name: 'Novo nome',
      description: 'Nova descrição',
      status: 'available',
      application: specification.application,
      isRequired: true,
    })
    expect(repository.replaceTemplate).not.toHaveBeenCalled()
  })

  it('validates legal application and rejects unavailable content', async () => {
    const specification = fakeDocumentSpecification()
    repository.findById.mockResolvedValue(specification)
    const application = {
      scope: 'legal_context' as const,
      moment: 'legal_production' as const,
      legalAreaIds: ['area-1'],
      legalTopicIdsByArea: { 'area-1': ['topic-1'] },
    }

    await expect(
      new UpdateDocumentSpecificationConfigurationUseCase(
        repository,
        catalogProvider,
      ).execute({
        documentSpecificationId: specification.id,
        changes: {
          name: 'Nome',
          description: 'Descrição',
          status: 'available',
          application,
          isRequired: false,
        },
      }),
    ).rejects.toBeInstanceOf(InvalidDocumentTemplateError)
    expect(catalogProvider.validateActive).not.toHaveBeenCalled()
    expect(repository.replaceConfiguration).not.toHaveBeenCalled()
  })

  it('allows an empty description', async () => {
    const specification = fakeDocumentSpecification()
    repository.findById.mockResolvedValue(specification)
    repository.replaceConfiguration.mockResolvedValue({
      ...specification,
      description: '',
    })

    await new UpdateDocumentSpecificationConfigurationUseCase(
      repository,
      catalogProvider,
    ).execute({
      documentSpecificationId: specification.id,
      changes: {
        name: 'Nome',
        description: '',
        status: 'unavailable',
        application: specification.application,
        isRequired: false,
      },
    })

    expect(repository.replaceConfiguration).toHaveBeenCalledWith(
      specification.id,
      expect.objectContaining({ description: '' }),
    )
  })

  it('rejects inactive catalog selections and preserves the repository', async () => {
    const specification = fakeDocumentSpecification({
      content: {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Texto' }] }],
      } as unknown as DocumentTemplateContent,
    })
    repository.findById.mockResolvedValue(specification)
    catalogProvider.validateActive.mockResolvedValue(false)

    await expect(
      new UpdateDocumentSpecificationConfigurationUseCase(
        repository,
        catalogProvider,
      ).execute({
        documentSpecificationId: specification.id,
        changes: {
          name: 'Nome',
          description: 'Descrição',
          status: 'unavailable',
          application: {
            scope: 'legal_context',
            moment: 'consultation',
            legalAreaIds: ['area-1'],
            legalTopicIdsByArea: { 'area-1': ['topic-1'] },
          },
          isRequired: false,
        },
      }),
    ).rejects.toBeInstanceOf(InvalidDocumentSpecificationConfigurationError)
    expect(repository.replaceConfiguration).not.toHaveBeenCalled()
  })

  it('translates missing and concurrent replacement to not-found', async () => {
    repository.findById.mockResolvedValue(undefined)
    await expect(
      new UpdateDocumentSpecificationConfigurationUseCase(
        repository,
        catalogProvider,
      ).execute({
        documentSpecificationId: 'missing',
        changes: {
          name: 'Nome',
          description: 'Descrição',
          status: 'unavailable',
          application: {
            scope: 'global',
            moment: 'consultation',
          },
          isRequired: false,
        },
      }),
    ).rejects.toBeInstanceOf(DocumentSpecificationNotFoundError)
  })
})
