import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import type { DocumentSpecification } from '../../domain/entities'
import { fakeDocumentSpecification } from '../../domain/entities/fakers'
import { DocumentSpecificationNotFoundError } from '../../domain/errors'
import type { DocumentSpecificationsRepository } from '../../interfaces'
import { GetDocumentSpecificationUseCase } from '../get-document-specification-use-case'

describe('Get Document Specification Use Case', () => {
  let repository: MockProxy<DocumentSpecificationsRepository>

  beforeEach(() => {
    repository = mock<DocumentSpecificationsRepository>()
  })

  it('returns the specification found by id', async () => {
    const specification = fakeDocumentSpecification()
    repository.findById.mockResolvedValue(specification)

    await expect(
      new GetDocumentSpecificationUseCase(repository).execute({
        documentSpecificationId: specification.id,
      }),
    ).resolves.toBe(specification satisfies DocumentSpecification)
    expect(repository.findById).toHaveBeenCalledWith(specification.id)
  })

  it('raises a domain not-found error when the repository has no specification', async () => {
    repository.findById.mockResolvedValue(undefined)

    await expect(
      new GetDocumentSpecificationUseCase(repository).execute({
        documentSpecificationId: 'missing-id',
      }),
    ).rejects.toBeInstanceOf(DocumentSpecificationNotFoundError)
  })
})
