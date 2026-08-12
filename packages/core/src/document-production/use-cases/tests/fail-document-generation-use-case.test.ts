import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { DocumentGenerationFaker } from '../../domain/entities/fakers'
import { DocumentReviewFindingCategory } from '../../domain/structures'
import {
  DocumentGenerationConflictError,
  DocumentGenerationNotFoundError,
  InvalidDocumentGenerationResultError,
} from '../../domain/errors'
import type { DocumentGenerationsRepository } from '../../interfaces'
import type { DatetimeProvider } from '../../../shared/interfaces'
import { FailDocumentGenerationUseCase } from '../fail-document-generation-use-case'

describe('Fail Document Generation Use Case', () => {
  let repository: MockProxy<DocumentGenerationsRepository>
  let datetimeProvider: MockProxy<DatetimeProvider>

  beforeEach(() => {
    repository = mock<DocumentGenerationsRepository>()
    datetimeProvider = mock<DatetimeProvider>()
  })

  it('fails a pending or running generation with understandable findings', async () => {
    const now = new Date('2026-08-11T12:00:00.000Z')
    const generation = DocumentGenerationFaker.fake({ status: 'running' })
    const findings = [
      {
        category: DocumentReviewFindingCategory.TemplateCoherence,
        message: 'O conteúdo não corresponde à estrutura esperada pelo modelo.',
      },
    ]
    const failed = DocumentGenerationFaker.fake({
      ...generation,
      status: 'failed',
      attemptsCount: 3,
      findings,
      failureMessage: 'Não foi possível produzir um documento coerente.',
      failedAt: now,
      updatedAt: now,
    })
    repository.findById.mockResolvedValue(generation)
    repository.replace.mockResolvedValue(failed)
    datetimeProvider.now.mockReturnValue(now)

    await expect(
      new FailDocumentGenerationUseCase(repository, datetimeProvider).execute({
        documentGenerationId: generation.id,
        attemptsCount: 3,
        failureMessage: ' Não foi possível produzir um documento coerente. ',
        findings,
      }),
    ).resolves.toBe(failed)
    expect(repository.replace).toHaveBeenCalledWith(
      generation.id,
      {
        status: 'failed',
        attemptsCount: 3,
        findings,
        failureMessage: 'Não foi possível produzir um documento coerente.',
        failedAt: now,
        updatedAt: now,
      },
      ['pending', 'running'],
    )
  })

  it('rejects a terminal generation', async () => {
    const generation = DocumentGenerationFaker.fake({ status: 'completed' })
    repository.findById.mockResolvedValue(generation)

    await expect(
      new FailDocumentGenerationUseCase(repository, datetimeProvider).execute({
        documentGenerationId: generation.id,
        attemptsCount: 3,
        failureMessage: 'Falha final.',
        findings: [],
      }),
    ).rejects.toBeInstanceOf(DocumentGenerationConflictError)
    expect(repository.replace).not.toHaveBeenCalled()
  })

  it('rejects an invalid failure result', async () => {
    const generation = DocumentGenerationFaker.fake({ status: 'pending' })
    repository.findById.mockResolvedValue(generation)

    await expect(
      new FailDocumentGenerationUseCase(repository, datetimeProvider).execute({
        documentGenerationId: generation.id,
        attemptsCount: -1,
        failureMessage: ' ',
        findings: [],
      }),
    ).rejects.toBeInstanceOf(InvalidDocumentGenerationResultError)
    expect(repository.replace).not.toHaveBeenCalled()
  })

  it('raises not found and concurrent transition errors', async () => {
    const useCase = new FailDocumentGenerationUseCase(repository, datetimeProvider)
    repository.findById.mockResolvedValueOnce(undefined)

    await expect(
      useCase.execute({
        documentGenerationId: 'missing-generation',
        attemptsCount: 0,
        failureMessage: 'Falha antes da execução.',
        findings: [],
      }),
    ).rejects.toBeInstanceOf(DocumentGenerationNotFoundError)

    const generation = DocumentGenerationFaker.fake({ status: 'running' })
    repository.findById.mockResolvedValueOnce(generation)
    repository.replace.mockResolvedValueOnce(undefined)
    datetimeProvider.now.mockReturnValue(new Date('2026-08-11T12:00:00.000Z'))

    await expect(
      useCase.execute({
        documentGenerationId: generation.id,
        attemptsCount: 1,
        failureMessage: 'Falha durante a execução.',
        findings: [],
      }),
    ).rejects.toBeInstanceOf(DocumentGenerationConflictError)
  })
})
