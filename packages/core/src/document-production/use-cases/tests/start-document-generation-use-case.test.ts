import type { DatetimeProvider } from '#shared/interfaces/datetime-provider'
import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { DocumentGenerationFaker } from '../../domain/entities/fakers'
import {
  DocumentGenerationConflictError,
  DocumentGenerationNotFoundError,
} from '../../domain/errors'
import type { DocumentGenerationsRepository } from '../../interfaces'
import { StartDocumentGenerationUseCase } from '../start-document-generation-use-case'

describe('Start Document Generation Use Case', () => {
  let repository: MockProxy<DocumentGenerationsRepository>
  let datetimeProvider: MockProxy<DatetimeProvider>
  let useCase: StartDocumentGenerationUseCase

  beforeEach(() => {
    repository = mock<DocumentGenerationsRepository>()
    datetimeProvider = mock<DatetimeProvider>()
    useCase = new StartDocumentGenerationUseCase(repository, datetimeProvider)
  })

  it('transitions a pending generation to running', async () => {
    const generation = DocumentGenerationFaker.fake({ status: 'pending' })
    const now = new Date('2026-08-11T15:00:00.000Z')
    const started = DocumentGenerationFaker.fake({
      ...generation,
      status: 'running',
      startedAt: now,
      updatedAt: now,
    })
    repository.findById.mockResolvedValue(generation)
    repository.replace.mockResolvedValue(started)
    datetimeProvider.now.mockReturnValue(now)

    await expect(useCase.execute({ documentGenerationId: generation.id })).resolves.toBe(
      started,
    )
    expect(repository.replace).toHaveBeenCalledWith(
      generation.id,
      {
        status: 'running',
        attemptsCount: 0,
        findings: [],
        startedAt: now,
        updatedAt: now,
      },
      ['pending'],
    )
  })

  it('raises a not-found error when the generation does not exist', async () => {
    repository.findById.mockResolvedValue(undefined)

    await expect(
      useCase.execute({ documentGenerationId: 'missing-generation' }),
    ).rejects.toBeInstanceOf(DocumentGenerationNotFoundError)
  })

  it('returns a generation that is already running', async () => {
    const generation = DocumentGenerationFaker.fake({ status: 'running' })
    repository.findById.mockResolvedValue(generation)

    await expect(useCase.execute({ documentGenerationId: generation.id })).resolves.toBe(
      generation,
    )
    expect(repository.replace).not.toHaveBeenCalled()
  })

  it('rejects a generation that cannot be started', async () => {
    const generation = DocumentGenerationFaker.fake({ status: 'completed' })
    repository.findById.mockResolvedValue(generation)

    await expect(
      useCase.execute({ documentGenerationId: generation.id }),
    ).rejects.toBeInstanceOf(DocumentGenerationConflictError)
  })

  it('detects a concurrent status change', async () => {
    const generation = DocumentGenerationFaker.fake({ status: 'pending' })
    repository.findById.mockResolvedValue(generation)
    repository.replace.mockResolvedValue(undefined)
    datetimeProvider.now.mockReturnValue(new Date('2026-08-11T15:00:00.000Z'))

    await expect(
      useCase.execute({ documentGenerationId: generation.id }),
    ).rejects.toBeInstanceOf(DocumentGenerationConflictError)
  })
})
