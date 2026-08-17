import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { DocumentGenerationFaker } from '../../domain/entities/fakers'
import { DocumentGenerationNotFoundError } from '../../domain/errors'
import type { DocumentGenerationsRepository } from '../../interfaces'
import { LoadDocumentGenerationUseCase } from '../load-document-generation-use-case'

describe('Load Document Generation Use Case', () => {
  let repository: MockProxy<DocumentGenerationsRepository>

  beforeEach(() => {
    repository = mock<DocumentGenerationsRepository>()
  })

  it('returns the generation found by id', async () => {
    const generation = DocumentGenerationFaker.fake()
    repository.findById.mockResolvedValue(generation)

    await expect(
      new LoadDocumentGenerationUseCase(repository).execute({
        documentGenerationId: generation.id,
      }),
    ).resolves.toBe(generation)
    expect(repository.findById).toHaveBeenCalledWith(generation.id)
  })

  it('raises a not-found error when the generation does not exist', async () => {
    repository.findById.mockResolvedValue(undefined)

    await expect(
      new LoadDocumentGenerationUseCase(repository).execute({
        documentGenerationId: 'missing-generation',
      }),
    ).rejects.toBeInstanceOf(DocumentGenerationNotFoundError)
  })
})
