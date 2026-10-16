import { describe, expect, it, vi } from 'vitest'

import { PublishConsultationEventJob } from '@/consultation/messaging/inngest/jobs/publish-consultation-event-job'

const event = {
  id: 'a4337a86-6835-4ca9-95b5-9259609d8cf6',
  consultationId: 'b4337a86-6835-4ca9-95b5-9259609d8cf6',
  name: 'consultation/consultation.completed' as const,
  payload: {
    consultationId: 'b4337a86-6835-4ca9-95b5-9259609d8cf6',
    intakeId: 'c4337a86-6835-4ca9-95b5-9259609d8cf6',
    completedBy: 'd4337a86-6835-4ca9-95b5-9259609d8cf6',
    occurredAt: '2030-01-01T12:00:00.000Z',
  },
  occurredAt: new Date('2030-01-01T12:00:00.000Z'),
}

function makeJob(repository: any, broker: any) {
  return new PublishConsultationEventJob(
    { createFunction: vi.fn((_config, handler) => handler) } as any,
    repository,
    broker,
  )
}

describe('PublishConsultationEventJob', () => {
  it('publishes and marks a consultation outbox event with its stable id', async () => {
    const repository = {
      listPending: vi.fn().mockResolvedValue([event]),
      markPublished: vi.fn().mockResolvedValue(true),
    }
    const broker = { publish: vi.fn().mockResolvedValue(undefined) }
    const job = makeJob(repository, broker)
    const step = { run: vi.fn(async (_name, fn) => fn()) }

    await (job as any).function({ step })

    expect(broker.publish).toHaveBeenCalledWith(expect.anything(), event.id)
    expect(repository.markPublished).toHaveBeenCalledWith(event.id, expect.any(Date))
  })

  it('retries without marking, then deduplicates by reusing the outbox id', async () => {
    const repository = {
      listPending: vi.fn().mockResolvedValue([event]),
      markPublished: vi.fn().mockResolvedValue(true),
    }
    const broker = {
      publish: vi
        .fn()
        .mockRejectedValueOnce(new Error('broker unavailable'))
        .mockResolvedValue(undefined),
    }
    const job = makeJob(repository, broker)
    const step = { run: vi.fn(async (_name, fn) => fn()) }

    await expect((job as any).function({ step })).rejects.toThrow('broker unavailable')
    expect(repository.markPublished).not.toHaveBeenCalled()

    await (job as any).function({ step })
    expect(broker.publish).toHaveBeenNthCalledWith(1, expect.anything(), event.id)
    expect(broker.publish).toHaveBeenNthCalledWith(2, expect.anything(), event.id)
    expect(repository.markPublished).toHaveBeenCalledTimes(1)
  })
})
