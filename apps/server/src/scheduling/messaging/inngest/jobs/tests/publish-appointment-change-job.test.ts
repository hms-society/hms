import { describe, expect, it, vi } from 'vitest'
import { AppointmentFaker } from '@hms/core/scheduling/domain/entities/fakers'

import { PublishAppointmentChangeJob } from '@/scheduling/messaging/inngest/jobs/publish-appointment-change-job'

const ids = {
  change: 'a4337a86-6835-4ca9-95b5-9259609d8cf6',
  appointment: 'b4337a86-6835-4ca9-95b5-9259609d8cf6',
  schedule: 'c4337a86-6835-4ca9-95b5-9259609d8cf6',
  client: 'd4337a86-6835-4ca9-95b5-9259609d8cf6',
  actor: 'e4337a86-6835-4ca9-95b5-9259609d8cf6',
}

function makePendingChange() {
  return {
    change: {
      id: ids.change,
      appointmentId: ids.appointment,
      kind: 'cancelled' as const,
      actorId: ids.actor,
      occurredAt: new Date('2030-01-01T12:00:00.000Z'),
      previousStartsAt: new Date('2030-01-01T13:00:00.000Z'),
      previousEndsAt: new Date('2030-01-01T13:45:00.000Z'),
      previousRevision: new Date('2030-01-01T11:00:00.000Z'),
      resultingRevision: new Date('2030-01-01T12:00:00.000Z'),
    },
    appointment: AppointmentFaker.fake({
      id: ids.appointment,
      scheduleId: ids.schedule,
      clientId: ids.client,
      startsAt: new Date('2030-01-01T13:00:00.000Z'),
      endsAt: new Date('2030-01-01T13:45:00.000Z'),
    }),
  }
}

function makeJob(repository: any, broker: any) {
  return new PublishAppointmentChangeJob(
    { createFunction: vi.fn((_config, handler) => handler) } as any,
    repository,
    broker,
  )
}

describe('PublishAppointmentChangeJob', () => {
  it('publishes after loading pending changes and marks the same stable change id', async () => {
    const repository = {
      listPendingChanges: vi.fn().mockResolvedValue([makePendingChange()]),
      markChangePublished: vi.fn().mockResolvedValue(true),
    }
    const broker = { publish: vi.fn().mockResolvedValue(undefined) }
    const job = makeJob(repository, broker)
    const step = { run: vi.fn(async (_name, fn) => fn()) }

    await (job as any).function({ step })

    expect(broker.publish).toHaveBeenCalledWith(expect.anything(), ids.change)
    expect(repository.markChangePublished).toHaveBeenCalledWith(
      ids.change,
      expect.any(Date),
    )
  })

  it('retries the same pending event without marking or changing its stable id after failure', async () => {
    const pending = makePendingChange()
    const repository = {
      listPendingChanges: vi.fn().mockResolvedValue([pending]),
      markChangePublished: vi.fn().mockResolvedValue(true),
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
    expect(repository.markChangePublished).not.toHaveBeenCalled()

    await (job as any).function({ step })
    expect(broker.publish).toHaveBeenNthCalledWith(1, expect.anything(), ids.change)
    expect(broker.publish).toHaveBeenNthCalledWith(2, expect.anything(), ids.change)
    expect(repository.markChangePublished).toHaveBeenCalledTimes(1)
  })
})
