import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { fakeDocumentSpecification } from '../../domain/entities/fakers'
import { DocumentSpecificationNotFoundError } from '../../domain/errors'
import type { DocumentSpecificationMutationRepository } from '../../interfaces'
import { DeleteDocumentSpecificationUseCase } from '../delete-document-specification-use-case'

describe('Delete Document Specification Use Case', () => {
  let repository: MockProxy<DocumentSpecificationMutationRepository>

  beforeEach(() => {
    repository = mock<DocumentSpecificationMutationRepository>()
  })

  it('removes the specification found by id', async () => {
    const specification = fakeDocumentSpecification()
    repository.remove.mockResolvedValue(true)

    await expect(
      new DeleteDocumentSpecificationUseCase(repository).execute({
        documentSpecificationId: specification.id,
      }),
    ).resolves.toBeUndefined()
    expect(repository.remove).toHaveBeenCalledWith(specification.id)
  })

  it('raises a domain not-found error when the specification does not exist', async () => {
    repository.remove.mockResolvedValue(false)

    await expect(
      new DeleteDocumentSpecificationUseCase(repository).execute({
        documentSpecificationId: 'missing-id',
      }),
    ).rejects.toBeInstanceOf(DocumentSpecificationNotFoundError)
  })
})
