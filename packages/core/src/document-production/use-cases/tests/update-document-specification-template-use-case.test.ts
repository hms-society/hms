import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { DocumentSpecificationFaker } from '../../domain/entities/fakers'
import {
  DocumentSpecificationNotFoundError,
  InvalidDocumentTemplateError,
} from '../../domain/errors'
import type { DocumentTemplateContent } from '../../domain/structures'
import type { DocumentSpecificationsRepository } from '../../interfaces'
import { UpdateDocumentSpecificationTemplateUseCase } from '../update-document-specification-template-use-case'

describe('Update Document Specification Template Use Case', () => {
  let repository: MockProxy<DocumentSpecificationsRepository>

  beforeEach(() => {
    repository = mock<DocumentSpecificationsRepository>()
  })

  it('validates tokens, trims variables and updates only the template boundary', async () => {
    const specification = DocumentSpecificationFaker.fake({ name: 'Configuração preservada' })
    repository.findById.mockResolvedValue(specification)
    repository.replaceTemplate.mockResolvedValue(specification)

    await new UpdateDocumentSpecificationTemplateUseCase(repository).execute({
      documentSpecificationId: specification.id,
      changes: {
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: '{{cliente_nome}} {{nome_processo}}' }],
            },
          ],
        } as unknown as DocumentTemplateContent,
        variables: [
          {
            label: ' Nome do processo ',
            technicalName: ' nome_processo ',
            description: ' Descrição ',
          },
        ],
      },
    })

    expect(repository.replaceTemplate).toHaveBeenCalledWith(specification.id, {
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: '{{cliente_nome}} {{nome_processo}}' }],
          },
        ],
      },
      variables: [
        {
          label: 'Nome do processo',
          technicalName: 'nome_processo',
          description: 'Descrição',
        },
      ],
    })
    expect(repository.replaceConfiguration).not.toHaveBeenCalled()
  })

  it('rejects unknown or malformed tokens before persistence', async () => {
    const specification = DocumentSpecificationFaker.fake()
    repository.findById.mockResolvedValue(specification)

    await expect(
      new UpdateDocumentSpecificationTemplateUseCase(repository).execute({
        documentSpecificationId: specification.id,
        changes: {
          content: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Texto {{desconhecido}}' }],
              },
            ],
          } as unknown as DocumentTemplateContent,
          variables: [],
        },
      }),
    ).rejects.toBeInstanceOf(InvalidDocumentTemplateError)
    expect(repository.replaceTemplate).not.toHaveBeenCalled()

    repository.replaceTemplate.mockResolvedValue(specification)
    await new UpdateDocumentSpecificationTemplateUseCase(repository).execute({
      documentSpecificationId: specification.id,
      changes: {
        content: { type: 'doc', content: [{ type: 'paragraph' }] },
        variables: [
          {
            label: 'Cliente contratante',
            technicalName: 'cliente_nome',
            systemTechnicalName: 'cliente_nome',
          },
        ],
      },
    })
    expect(repository.replaceTemplate).toHaveBeenLastCalledWith(specification.id, {
      content: { type: 'doc', content: [{ type: 'paragraph' }] },
      variables: [
        {
          label: 'Cliente contratante',
          technicalName: 'cliente_nome',
          systemTechnicalName: 'cliente_nome',
        },
      ],
    })
  })

  it('accepts variable names with repeated and trailing underscores', async () => {
    const specification = DocumentSpecificationFaker.fake()
    repository.findById.mockResolvedValue(specification)
    repository.replaceTemplate.mockResolvedValue(specification)

    await new UpdateDocumentSpecificationTemplateUseCase(repository).execute({
      documentSpecificationId: specification.id,
      changes: {
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: '{{campo__extra}} {{campo_}}' }],
            },
          ],
        } as unknown as DocumentTemplateContent,
        variables: [
          { label: 'Campo extra', technicalName: 'campo__extra' },
          { label: 'Campo final', technicalName: 'campo_' },
        ],
      },
    })

    expect(repository.replaceTemplate).toHaveBeenCalled()
  })

  it('accepts ordered lists and preserves their list attributes', async () => {
    const specification = DocumentSpecificationFaker.fake()
    repository.findById.mockResolvedValue(specification)
    repository.replaceTemplate.mockResolvedValue(specification)
    const content = {
      type: 'doc',
      content: [
        {
          type: 'orderedList',
          attrs: { start: 1, type: null },
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  attrs: { textAlign: null },
                  content: [{ type: 'text', text: 'Primeiro item' }],
                },
              ],
            },
          ],
        },
      ],
    } as unknown as DocumentTemplateContent

    await new UpdateDocumentSpecificationTemplateUseCase(repository).execute({
      documentSpecificationId: specification.id,
      changes: { content, variables: [] },
    })

    expect(repository.replaceTemplate).toHaveBeenCalledWith(specification.id, {
      content,
      variables: [],
    })
  })

  it('rejects absent specifications and keeps configuration untouched', async () => {
    repository.findById.mockResolvedValue(undefined)

    await expect(
      new UpdateDocumentSpecificationTemplateUseCase(repository).execute({
        documentSpecificationId: 'missing',
        changes: { content: { type: 'doc' }, variables: [] },
      }),
    ).rejects.toBeInstanceOf(DocumentSpecificationNotFoundError)
    expect(repository.replaceConfiguration).not.toHaveBeenCalled()
  })
})
