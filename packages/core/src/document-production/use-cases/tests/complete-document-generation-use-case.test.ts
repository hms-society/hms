import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { fakeDocumentGeneration } from '../../domain/entities/fakers'
import {
  DocumentGenerationConflictError,
  DocumentGenerationNotFoundError,
  InvalidDocumentGenerationResultError,
} from '../../domain/errors'
import type { DocumentGenerationsRepository } from '../../interfaces'
import type { DatetimeProvider } from '../../../shared/interfaces'
import { CompleteDocumentGenerationUseCase } from '../complete-document-generation-use-case'

describe('Complete Document Generation Use Case', () => {
  let repository: MockProxy<DocumentGenerationsRepository>
  let datetimeProvider: MockProxy<DatetimeProvider>

  beforeEach(() => {
    repository = mock<DocumentGenerationsRepository>()
    datetimeProvider = mock<DatetimeProvider>()
  })

  it('completes a running generation atomically', async () => {
    const now = new Date('2026-08-11T12:00:00.000Z')
    const generation = fakeDocumentGeneration({ status: 'running' })
    const completed = fakeDocumentGeneration({
      ...generation,
      status: 'completed',
      attemptsCount: 2,
      documentVersionId: 'document-version-id',
      completedAt: now,
      updatedAt: now,
    })
    repository.findById.mockResolvedValue(generation)
    repository.replace.mockResolvedValue(completed)
    datetimeProvider.now.mockReturnValue(now)

    await expect(
      new CompleteDocumentGenerationUseCase(repository, datetimeProvider).execute({
        documentGenerationId: generation.id,
        documentVersionId: ' document-version-id ',
        attemptsCount: 2,
      }),
    ).resolves.toBe(completed)
    expect(repository.replace).toHaveBeenCalledWith(
      generation.id,
      {
        status: 'completed',
        attemptsCount: 2,
        findings: [],
        documentVersionId: 'document-version-id',
        completedAt: now,
        updatedAt: now,
      },
      ['running'],
    )
  })

  it('rejects a generation that is not running', async () => {
    const generation = fakeDocumentGeneration({ status: 'cancelled' })
    repository.findById.mockResolvedValue(generation)

    await expect(
      new CompleteDocumentGenerationUseCase(repository, datetimeProvider).execute({
        documentGenerationId: generation.id,
        documentVersionId: 'document-version-id',
        attemptsCount: 1,
      }),
    ).rejects.toBeInstanceOf(DocumentGenerationConflictError)
    expect(repository.replace).not.toHaveBeenCalled()
  })

  it('rejects an invalid result', async () => {
    const generation = fakeDocumentGeneration({ status: 'running' })
    repository.findById.mockResolvedValue(generation)

    await expect(
      new CompleteDocumentGenerationUseCase(repository, datetimeProvider).execute({
        documentGenerationId: generation.id,
        documentVersionId: ' ',
        attemptsCount: 4,
      }),
    ).rejects.toBeInstanceOf(InvalidDocumentGenerationResultError)
    expect(repository.replace).not.toHaveBeenCalled()
  })

  it('raises not found and concurrent transition errors', async () => {
    const useCase = new CompleteDocumentGenerationUseCase(repository, datetimeProvider)
    repository.findById.mockResolvedValueOnce(undefined)

    await expect(
      useCase.execute({
        documentGenerationId: 'missing-generation',
        documentVersionId: 'document-version-id',
        attemptsCount: 1,
      }),
    ).rejects.toBeInstanceOf(DocumentGenerationNotFoundError)

    const generation = fakeDocumentGeneration({ status: 'running' })
    repository.findById.mockResolvedValueOnce(generation)
    repository.replace.mockResolvedValueOnce(undefined)
    datetimeProvider.now.mockReturnValue(new Date('2026-08-11T12:00:00.000Z'))

    await expect(
      useCase.execute({
        documentGenerationId: generation.id,
        documentVersionId: 'document-version-id',
        attemptsCount: 1,
      }),
    ).rejects.toBeInstanceOf(DocumentGenerationConflictError)
  })
})
