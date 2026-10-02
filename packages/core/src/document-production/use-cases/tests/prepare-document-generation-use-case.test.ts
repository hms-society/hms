import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import {
  DocumentGenerationFaker,
  DocumentSpecificationFaker,
} from '../../domain/entities/fakers'
import type { DocumentTemplateContent } from '../../domain/structures'
import type {
  DocumentGenerationsRepository,
  DocumentSpecificationsRepository,
} from '../../interfaces'
import { PrepareDocumentGenerationUseCase } from '../prepare-document-generation-use-case'

describe('Prepare Document Generation Use Case', () => {
  let generationsRepository: MockProxy<DocumentGenerationsRepository>
  let specificationsRepository: MockProxy<DocumentSpecificationsRepository>

  beforeEach(() => {
    generationsRepository = mock<DocumentGenerationsRepository>()
    specificationsRepository = mock<DocumentSpecificationsRepository>()
  })

  it('fills template variables from the immutable validated source snapshot', async () => {
    const specification = DocumentSpecificationFaker.fake({
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Requerente: {{nome_requerente}}; CPF: {{cpf_requerente}}',
              },
            ],
          },
        ],
      } as unknown as DocumentTemplateContent,
      variables: [
        { label: 'Nome', technicalName: 'nome_requerente' },
        { label: 'CPF', technicalName: 'cpf_requerente' },
      ],
    })
    const generation = DocumentGenerationFaker.fake()
    const source = {
      type: 'case' as const,
      id: '7c470059-82f8-4616-ac79-70934f758f37',
      data: {
        templateVariableValues: {
          nome_requerente: 'Helena Maria de Albuquerque Costa',
          cpf_requerente: '123.456.789-09',
        },
      },
    }
    specificationsRepository.findById.mockResolvedValue(specification)
    generationsRepository.addOrGet.mockResolvedValue(generation)

    await new PrepareDocumentGenerationUseCase(
      generationsRepository,
      specificationsRepository,
    ).execute({
      documentGenerationId: generation.id,
      documentId: generation.documentId,
      documentSpecificationVersionId: specification.id,
      requestedByCollaboratorId: generation.requestedByCollaboratorId,
      source,
    })

    expect(generationsRepository.addOrGet).toHaveBeenCalledWith(
      expect.objectContaining({
        template: expect.objectContaining({
          content: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Requerente: Helena Maria de Albuquerque Costa; CPF: 123.456.789-09',
                  },
                ],
              },
            ],
          },
        }),
      }),
    )
  })

  it('keeps unresolved variables as explicit placeholders instead of inventing values', async () => {
    const specification = DocumentSpecificationFaker.fake({
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'NIT: {{nit_requerente}}' }],
          },
        ],
      } as unknown as DocumentTemplateContent,
      variables: [{ label: 'NIT', technicalName: 'nit_requerente' }],
    })
    const generation = DocumentGenerationFaker.fake()
    const source = {
      type: 'case' as const,
      id: '7c470059-82f8-4616-ac79-70934f758f37',
      data: { templateVariableValues: {} },
    }
    specificationsRepository.findById.mockResolvedValue(specification)
    generationsRepository.addOrGet.mockResolvedValue(generation)

    await new PrepareDocumentGenerationUseCase(
      generationsRepository,
      specificationsRepository,
    ).execute({
      documentGenerationId: generation.id,
      documentId: generation.documentId,
      documentSpecificationVersionId: specification.id,
      requestedByCollaboratorId: generation.requestedByCollaboratorId,
      source,
    })

    expect(generationsRepository.addOrGet).toHaveBeenCalledWith(
      expect.objectContaining({
        template: expect.objectContaining({
          content: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'NIT: {{nit_requerente}}' }],
              },
            ],
          },
        }),
      }),
    )
  })

  it('uses the selected prior version content as the base for a revision', async () => {
    const specification = DocumentSpecificationFaker.fake({
      content: {
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'Template original' }] },
        ],
      } as unknown as DocumentTemplateContent,
      variables: [],
    })
    const baseDocumentContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Texto já editado na versão v2' }],
        },
      ],
    } as unknown as DocumentTemplateContent
    const generation = DocumentGenerationFaker.fake()
    specificationsRepository.findById.mockResolvedValue(specification)
    generationsRepository.addOrGet.mockResolvedValue(generation)

    await new PrepareDocumentGenerationUseCase(
      generationsRepository,
      specificationsRepository,
    ).execute({
      documentGenerationId: generation.id,
      documentId: generation.documentId,
      documentSpecificationVersionId: specification.id,
      requestedByCollaboratorId: generation.requestedByCollaboratorId,
      source: {
        type: 'case',
        id: '7c470059-82f8-4616-ac79-70934f758f37',
        data: { baseDocumentContent },
      },
    })

    expect(generationsRepository.addOrGet).toHaveBeenCalledWith(
      expect.objectContaining({
        template: expect.objectContaining({ content: baseDocumentContent }),
      }),
    )
  })
})
