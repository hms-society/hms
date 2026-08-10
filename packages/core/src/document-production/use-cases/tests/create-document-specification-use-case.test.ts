import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import type { LegalExpertiseCatalogProvider } from '#legal-catalog/interfaces'
import { fakeDocumentSpecification } from '../../domain/entities/fakers'
import { InvalidDocumentSpecificationConfigurationError } from '../../domain/errors'
import type {
  CreateDocumentSpecificationInput,
  DocumentTemplateContent,
} from '../../domain/structures'
import type { DocumentSpecificationsRepository } from '../../interfaces'
import { CreateDocumentSpecificationUseCase } from '../create-document-specification-use-case'

describe('Create Document Specification Use Case', () => {
  let repository: MockProxy<DocumentSpecificationsRepository>
  let catalogProvider: MockProxy<LegalExpertiseCatalogProvider>

  beforeEach(() => {
    repository = mock<DocumentSpecificationsRepository>()
    catalogProvider = mock<LegalExpertiseCatalogProvider>()
    repository.add.mockResolvedValue(fakeDocumentSpecification())
    catalogProvider.validateActive.mockResolvedValue(true)
  })

  it('normalizes configuration and creates an available specification with its template', async () => {
    const input: CreateDocumentSpecificationInput = {
      name: '  Procuração  ',
      description: '  Modelo inicial  ',
      application: {
        scope: 'global',
        moment: 'formalization',
      },
      isRequired: true,
      content: {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Conteúdo' }] }],
      } as unknown as DocumentTemplateContent,
      variables: [],
    }

    await new CreateDocumentSpecificationUseCase(repository, catalogProvider).execute(
      input,
    )

    expect(repository.add).toHaveBeenCalledWith({
      name: 'Procuração',
      description: 'Modelo inicial',
      application: {
        scope: 'global',
        moment: 'formalization',
      },
      isRequired: true,
      status: 'available',
      content: {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Conteúdo' }] }],
      } as unknown as DocumentTemplateContent,
      variables: [],
    })
    expect(catalogProvider.validateActive).not.toHaveBeenCalled()
  })

  it('creates an unavailable specification without template text', async () => {
    await new CreateDocumentSpecificationUseCase(repository, catalogProvider).execute({
      name: 'Modelo indisponível',
      description: '',
      application: { scope: 'global', moment: 'consultation' },
      isRequired: false,
      status: 'unavailable',
      content: { type: 'doc', content: [{ type: 'paragraph' }] },
      variables: [],
    })

    expect(repository.add).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Modelo indisponível', status: 'unavailable' }),
    )
  })

  it('validates and forwards legal context through the public catalog provider', async () => {
    const application = {
      scope: 'legal_context' as const,
      moment: 'legal_production' as const,
      legalAreaIds: [' area-1 '],
      legalTopicIdsByArea: { 'area-1': [' topic-1 '] },
    }

    await new CreateDocumentSpecificationUseCase(repository, catalogProvider).execute({
      name: 'Modelo',
      description: 'Descrição',
      application,
      isRequired: false,
      content: {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Conteúdo' }] }],
      } as unknown as DocumentTemplateContent,
      variables: [],
    })

    expect(catalogProvider.validateActive).toHaveBeenCalledWith([
      { legalAreaId: 'area-1', legalTopicIds: ['topic-1'] },
    ])
    expect(repository.add.mock.calls[0]?.[0].application).toEqual({
      scope: 'legal_context',
      moment: 'legal_production',
      legalAreaIds: ['area-1'],
      legalTopicIdsByArea: { 'area-1': ['topic-1'] },
    })
  })

  it('allows an empty description', async () => {
    await new CreateDocumentSpecificationUseCase(repository, catalogProvider).execute({
      name: 'Modelo sem descrição',
      description: '',
      application: {
        scope: 'global',
        moment: 'consultation',
      },
      isRequired: false,
      content: {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Conteúdo' }] }],
      } as unknown as DocumentTemplateContent,
      variables: [],
    })

    expect(repository.add).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Modelo sem descrição',
        description: '',
      }),
    )
  })

  it('rejects invalid normalized configuration before persistence', async () => {
    await expect(
      new CreateDocumentSpecificationUseCase(repository, catalogProvider).execute({
        name: '   ',
        description: 'Descrição',
        application: {
          scope: 'global',
          moment: 'consultation',
        },
        isRequired: false,
      }),
    ).rejects.toBeInstanceOf(InvalidDocumentSpecificationConfigurationError)
    expect(repository.add).not.toHaveBeenCalled()
  })
})
