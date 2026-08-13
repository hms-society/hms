import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import {
  fakeDocumentGeneration,
  fakeDocumentSpecification,
} from '../../domain/entities/fakers'
import { DocumentSpecificationNotFoundError } from '../../domain/errors'
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

  it('creates a pending generation with source and template snapshots', async () => {
    const specification = fakeDocumentSpecification({ name: 'Procuração' })
    const generation = fakeDocumentGeneration()
    const source = {
      type: 'consultation' as const,
      id: '7c470059-82f8-4616-ac79-70934f758f37',
      data: { clientName: 'Maria da Silva' },
    }
    specificationsRepository.findById.mockResolvedValue(specification)
    generationsRepository.add.mockResolvedValue(generation)

    const result = await new PrepareDocumentGenerationUseCase(
      generationsRepository,
      specificationsRepository,
    ).execute({
      documentGenerationId: generation.id,
      documentId: generation.documentId,
      documentSpecificationVersionId: specification.id,
      requestedByCollaboratorId: generation.requestedByCollaboratorId,
      source,
    })

    expect(result).toBe(generation)
    expect(generationsRepository.add).toHaveBeenCalledWith({
      id: generation.id,
      documentId: generation.documentId,
      documentSpecificationVersionId: specification.id,
      requestedByCollaboratorId: generation.requestedByCollaboratorId,
      source,
      template: {
        name: specification.name,
        content: specification.content,
        variables: specification.variables,
      },
      status: 'pending',
      attemptsCount: 0,
      findings: [],
    })
  })

  it('rejects a request whose document specification does not exist', async () => {
    specificationsRepository.findById.mockResolvedValue(undefined)

    await expect(
      new PrepareDocumentGenerationUseCase(
        generationsRepository,
        specificationsRepository,
      ).execute({
        documentGenerationId: '78a38ffd-cfb1-49b7-9f49-830333b63367',
        documentId: '17fcbb49-5a34-48fc-9245-a5bc718e9d43',
        documentSpecificationVersionId: 'bd83c776-c478-4ff9-aeb7-a51afbcd7440',
        requestedByCollaboratorId: '6a64134b-06b4-49cb-9317-3379e048c611',
        source: {
          type: 'formalization',
          id: '4ec7a0cb-7213-4fcd-bc97-bb899d5b13e3',
          data: {},
        },
      }),
    ).rejects.toBeInstanceOf(DocumentSpecificationNotFoundError)
    expect(generationsRepository.add).not.toHaveBeenCalled()
  })
})
