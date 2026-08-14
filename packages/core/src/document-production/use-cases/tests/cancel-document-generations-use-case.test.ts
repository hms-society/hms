import type { Broker, DatetimeProvider } from '#shared/interfaces'
import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { DocumentGenerationFaker } from '../../domain/entities/fakers'
import { DocumentGenerationCancelledEvent } from '../../domain/events'
import type { DocumentGenerationsRepository } from '../../interfaces'
import { CancelDocumentGenerationsUseCase } from '../cancel-document-generations-use-case'

describe('Cancel Document Generations Use Case', () => {
  let repository: MockProxy<DocumentGenerationsRepository>
  let datetimeProvider: MockProxy<DatetimeProvider>
  let broker: MockProxy<Broker>
  let useCase: CancelDocumentGenerationsUseCase

  beforeEach(() => {
    repository = mock<DocumentGenerationsRepository>()
    datetimeProvider = mock<DatetimeProvider>()
    broker = mock<Broker>()
    useCase = new CancelDocumentGenerationsUseCase(repository, datetimeProvider, broker)
  })

  it('cancels every requested generation independently', async () => {
    const first = DocumentGenerationFaker.fake({ status: 'pending' })
    const second = DocumentGenerationFaker.fake({ status: 'running' })
    const now = new Date('2026-08-12T16:00:00.000Z')
    const firstCancelled = DocumentGenerationFaker.fake({
      ...first,
      status: 'cancelled',
      cancelledAt: now,
    })
    const secondCancelled = DocumentGenerationFaker.fake({
      ...second,
      status: 'cancelled',
      cancelledAt: now,
    })
    repository.findById.mockResolvedValueOnce(first).mockResolvedValueOnce(second)
    repository.replace
      .mockResolvedValueOnce(firstCancelled)
      .mockResolvedValueOnce(secondCancelled)
    datetimeProvider.now.mockReturnValue(now)

    await expect(
      useCase.execute({ documentGenerationIds: [first.id, second.id] }),
    ).resolves.toEqual([firstCancelled, secondCancelled])
    expect(broker.publish).toHaveBeenCalledTimes(2)
    expect(broker.publish).toHaveBeenCalledWith(
      new DocumentGenerationCancelledEvent({
        documentGenerationId: first.id,
        occurredAt: now,
      }),
    )
    expect(broker.publish).toHaveBeenCalledWith(
      new DocumentGenerationCancelledEvent({
        documentGenerationId: second.id,
        occurredAt: now,
      }),
    )
  })

  it('cancels a repeated generation only once', async () => {
    const generation = DocumentGenerationFaker.fake({ status: 'running' })
    const now = new Date('2026-08-12T16:00:00.000Z')
    const cancelled = DocumentGenerationFaker.fake({
      ...generation,
      status: 'cancelled',
      cancelledAt: now,
    })
    repository.findById.mockResolvedValue(generation)
    repository.replace.mockResolvedValue(cancelled)
    datetimeProvider.now.mockReturnValue(now)

    await expect(
      useCase.execute({
        documentGenerationIds: [generation.id, generation.id],
      }),
    ).resolves.toEqual([cancelled])
    expect(repository.findById).toHaveBeenCalledTimes(1)
    expect(broker.publish).toHaveBeenCalledTimes(1)
  })

  it('returns an empty result when no generation is active', async () => {
    await expect(useCase.execute({ documentGenerationIds: [] })).resolves.toEqual([])
    expect(repository.findById).not.toHaveBeenCalled()
    expect(broker.publish).not.toHaveBeenCalled()
  })
})
