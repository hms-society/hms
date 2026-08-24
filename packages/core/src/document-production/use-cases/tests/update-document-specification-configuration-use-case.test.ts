import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import type { LegalExpertiseCatalogProvider } from '#legal-catalog/interfaces'
import { DocumentSpecificationFaker } from '../../domain/entities/fakers'
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
    const specification = DocumentSpecificationFaker.fake({
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
      userId: 'user-123',
      documentSpecificationId: specification.id,
      changes: {
        name: '  Novo nome ',
        description: ' Nova descrição ',
        status: 'available',
        application: specification.application,
        accessClassification: 'Interno',
      },
    })

    expect(repository.replaceConfiguration).toHaveBeenCalledWith(specification.id, {
      name: 'Novo nome',
      description: 'Nova descrição',
      status: 'available',
      application: specification.application,
      accessClassification: 'Interno',
    })
    expect(repository.replaceTemplate).not.toHaveBeenCalled()
  })

  it('validates legal application while allowing an empty available template', async () => {
    const specification = DocumentSpecificationFaker.fake({ status: 'available' })
    repository.findById.mockResolvedValue(specification)
    repository.replaceConfiguration.mockResolvedValue(specification)
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
        userId: 'user-123',
        documentSpecificationId: specification.id,
        changes: {
          name: 'Nome',
          description: 'Descrição',
          status: 'available',
          application,
          accessClassification: 'Interno',
        },
      }),
    ).rejects.toBeInstanceOf(InvalidDocumentTemplateError)
    expect(catalogProvider.validateActive).not.toHaveBeenCalled()
    expect(repository.replaceConfiguration).not.toHaveBeenCalled()
  })

  it('persists configuration and template changes through the same save action', async () => {
    const specification = DocumentSpecificationFaker.fake()
    const content = {
      type: 'doc' as const,
      content: [
        {
          type: 'paragraph' as const,
          content: [{ type: 'text' as const, text: 'Novo conteúdo' }],
        },
      ],
    } as unknown as DocumentTemplateContent
    const variables = [
      {
        label: 'Cliente',
        technicalName: 'cliente_nome',
        systemTechnicalName: 'cliente_nome',
      },
    ]
    repository.findById.mockResolvedValue(specification)
    repository.replaceConfiguration.mockResolvedValue(specification)

    await new UpdateDocumentSpecificationConfigurationUseCase(
      repository,
      catalogProvider,
    ).execute({
      userId: 'user-123',
      documentSpecificationId: specification.id,
      changes: {
        name: 'Nome',
        description: '',
        status: 'available',
        application: specification.application,
        accessClassification: 'Interno',
        content,
        variables,
      },
    })

    expect(repository.replaceConfiguration).toHaveBeenCalledWith(specification.id, {
      name: 'Nome',
      description: '',
      status: 'available',
      application: specification.application,
      accessClassification: 'Interno',
      content,
      variables,
    })
  })

  it('preserves the system source when a variable receives an edited technical name', async () => {
    const specification = DocumentSpecificationFaker.fake()
    const content = {
      type: 'doc' as const,
      content: [
        {
          type: 'paragraph' as const,
          content: [{ type: 'text' as const, text: 'Olá {{nome_do_cliente}}' }],
        },
      ],
    } as unknown as DocumentTemplateContent
    const variables = [
      {
        label: 'Nome do cliente',
        technicalName: 'nome_do_cliente',
        systemTechnicalName: 'cliente_nome',
      },
    ]
    repository.findById.mockResolvedValue(specification)
    repository.replaceConfiguration.mockResolvedValue(specification)

    await new UpdateDocumentSpecificationConfigurationUseCase(
      repository,
      catalogProvider,
    ).execute({
      userId: 'user-123',
      documentSpecificationId: specification.id,
      changes: {
        name: 'Nome',
        description: '',
        status: 'available',
        application: specification.application,
        accessClassification: 'Interno',
        content,
        variables,
      },
    })

    expect(repository.replaceConfiguration).toHaveBeenCalledWith(
      specification.id,
      expect.objectContaining({ content, variables }),
    )
  })

  it('allows an empty description', async () => {
    const specification = DocumentSpecificationFaker.fake()
    repository.findById.mockResolvedValue(specification)
    repository.replaceConfiguration.mockResolvedValue({
      ...specification,
      description: '',
    })

    await new UpdateDocumentSpecificationConfigurationUseCase(
      repository,
      catalogProvider,
    ).execute({
      userId: 'user-123',
      documentSpecificationId: specification.id,
      changes: {
        name: 'Nome',
        description: '',
        status: 'unavailable',
        application: specification.application,
        accessClassification: 'Interno',
      },
    })

    expect(repository.replaceConfiguration).toHaveBeenCalledWith(
      specification.id,
      expect.objectContaining({ description: '' }),
    )
  })

  it('allows an unavailable specification to keep an empty template', async () => {
    const specification = DocumentSpecificationFaker.fake({
      status: 'available',
      content: {
        type: 'doc',
        content: [{ type: 'paragraph', attrs: { textAlign: null } }],
      } as unknown as DocumentTemplateContent,
    })
    repository.findById.mockResolvedValue(specification)
    repository.replaceConfiguration.mockResolvedValue({
      ...specification,
      status: 'unavailable',
    })

    await new UpdateDocumentSpecificationConfigurationUseCase(
      repository,
      catalogProvider,
    ).execute({
      userId: 'user-123',
      documentSpecificationId: specification.id,
      changes: {
        name: 'Nome',
        description: '',
        status: 'unavailable',
        application: specification.application,
        accessClassification: 'Interno',
        content: specification.content,
        variables: specification.variables,
      },
    })

    expect(repository.replaceConfiguration).toHaveBeenCalledWith(
      specification.id,
      expect.objectContaining({ status: 'unavailable', content: specification.content }),
    )
  })

  it('rejects inactive catalog selections and preserves the repository', async () => {
    const specification = DocumentSpecificationFaker.fake({
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
        userId: 'user-123',
        documentSpecificationId: specification.id,
        changes: {
          name: 'Nome',
          description: 'Descrição',
          status: 'unavailable',
          accessClassification: 'Interno',
          application: {
            scope: 'legal_context',
            moment: 'consultation',
            legalAreaIds: ['area-1'],
            legalTopicIdsByArea: { 'area-1': ['topic-1'] },
          },
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
        userId: 'user-123',
        documentSpecificationId: 'missing',
        changes: {
          name: 'Nome',
          description: 'Descrição',
          status: 'unavailable',
          accessClassification: 'Interno',
          application: {
            scope: 'global',
            moment: 'consultation',
          },
        },
      }),
    ).rejects.toBeInstanceOf(DocumentSpecificationNotFoundError)
  })
})
