import type { DatetimeProvider } from '#shared/interfaces/datetime-provider'
import type { Broker } from '#shared/interfaces/broker'
import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { DocumentGenerationFaker } from '../../domain/entities/fakers'
import { DocumentGenerationCancelledEvent } from '../../domain/events'
import {
  DocumentGenerationConflictError,
  DocumentGenerationNotFoundError,
} from '../../domain/errors'
import type { DocumentGenerationsRepository } from '../../interfaces'
import { CancelDocumentGenerationUseCase } from '../cancel-document-generation-use-case'

describe('Cancel Document Generation Use Case', () => {
  let repository: MockProxy<DocumentGenerationsRepository>
  let datetimeProvider: MockProxy<DatetimeProvider>
  let broker: MockProxy<Broker>
  let useCase: CancelDocumentGenerationUseCase

  beforeEach(() => {
    repository = mock<DocumentGenerationsRepository>()
    datetimeProvider = mock<DatetimeProvider>()
    broker = mock<Broker>()
    useCase = new CancelDocumentGenerationUseCase(repository, datetimeProvider, broker)
  })

  it.each(['pending', 'running'] as const)('cancels a %s generation', async (status) => {
    const generation = DocumentGenerationFaker.fake({
      status,
      attemptsCount: 2,
      findings: [
        {
          category: 'structure',
          message: 'A estrutura precisa de ajustes.',
        },
      ],
    })
    const now = new Date('2026-08-12T15:00:00.000Z')
    const cancelled = DocumentGenerationFaker.fake({
      ...generation,
      status: 'cancelled',
      cancelledAt: now,
      updatedAt: now,
    })
    repository.findById.mockResolvedValue(generation)
    repository.replace.mockResolvedValue(cancelled)
    datetimeProvider.now.mockReturnValue(now)

    await expect(useCase.execute({ documentGenerationId: generation.id })).resolves.toBe(
      cancelled,
    )
    expect(repository.replace).toHaveBeenCalledWith(
      generation.id,
      {
        status: 'cancelled',
        attemptsCount: generation.attemptsCount,
        findings: generation.findings,
        cancelledAt: now,
        updatedAt: now,
      },
      ['pending', 'running'],
    )
    expect(broker.publish).toHaveBeenCalledWith(
      new DocumentGenerationCancelledEvent({
        documentGenerationId: generation.id,
        occurredAt: now,
      }),
    )
  })

  it('republishes cancellation for a generation that is already cancelled', async () => {
    const cancelledAt = new Date('2026-08-12T14:00:00.000Z')
    const generation = DocumentGenerationFaker.fake({
      status: 'cancelled',
      cancelledAt,
    })
    repository.findById.mockResolvedValue(generation)

    await expect(useCase.execute({ documentGenerationId: generation.id })).resolves.toBe(
      generation,
    )
    expect(repository.replace).not.toHaveBeenCalled()
    expect(broker.publish).toHaveBeenCalledWith(
      new DocumentGenerationCancelledEvent({
        documentGenerationId: generation.id,
        occurredAt: cancelledAt,
      }),
    )
  })

  it('raises a not-found error when the generation does not exist', async () => {
    repository.findById.mockResolvedValue(undefined)

    await expect(
      useCase.execute({ documentGenerationId: 'missing-generation' }),
    ).rejects.toBeInstanceOf(DocumentGenerationNotFoundError)
    expect(broker.publish).not.toHaveBeenCalled()
  })

  it.each([
    'completed',
    'failed',
  ] as const)('rejects cancellation of a %s generation', async (status) => {
    const generation = DocumentGenerationFaker.fake({ status })
    repository.findById.mockResolvedValue(generation)

    await expect(
      useCase.execute({ documentGenerationId: generation.id }),
    ).rejects.toBeInstanceOf(DocumentGenerationConflictError)
    expect(repository.replace).not.toHaveBeenCalled()
    expect(broker.publish).not.toHaveBeenCalled()
  })

  it('detects a concurrent status change', async () => {
    const generation = DocumentGenerationFaker.fake({ status: 'running' })
    repository.findById.mockResolvedValue(generation)
    repository.replace.mockResolvedValue(undefined)
    datetimeProvider.now.mockReturnValue(new Date('2026-08-12T15:00:00.000Z'))

    await expect(
      useCase.execute({ documentGenerationId: generation.id }),
    ).rejects.toBeInstanceOf(DocumentGenerationConflictError)
    expect(broker.publish).not.toHaveBeenCalled()
  })
})
