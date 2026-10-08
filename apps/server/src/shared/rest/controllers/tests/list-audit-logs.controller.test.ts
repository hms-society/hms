import { describe, expect, it, vi } from 'vitest'

import type { AuditEvent } from '@hms/core/shared/domain/structures'
import type { AuditLogsRepository } from '@hms/core/shared/interfaces'

import { ListAuditLogsController } from '@/shared/rest/controllers'

describe('ListAuditLogsController', () => {
  it('lists logs for an administrator with parsed filters', async () => {
    const repository = makeRepository()
    const controller = new ListAuditLogsController(repository as never)

    await controller.handle(
      {
        page: '2',
        limit: '10',
        entityType: 'third_party',
        origin: 'human',
        status: 'success',
      },
      { profile: 'admin' } as never,
    )

    expect(repository.list).toHaveBeenCalledWith({
      page: 2,
      limit: 10,
      from: undefined,
      to: undefined,
      actorId: undefined,
      action: undefined,
      entityType: 'third_party',
      origin: 'human',
      status: 'success',
    })
  })

  it('returns details for a supervisor', async () => {
    const repository = makeRepository()
    const event = makeEvent()
    repository.findById.mockResolvedValue(event)
    const controller = new ListAuditLogsController(repository as never)

    await expect(
      controller.getDetails(event.id, { profile: 'supervisor' } as never),
    ).resolves.toEqual(event)
  })

  it('rejects unauthorized collaborators', async () => {
    const controller = new ListAuditLogsController(makeRepository() as never)

    await expect(
      controller.handle({}, { profile: 'lawyer' } as never),
    ).rejects.toMatchObject({
      message: 'Only administrators and compliance supervisors can view audit logs.',
    })
  })

  it('rejects an invalid actor UUID', async () => {
    const controller = new ListAuditLogsController(makeRepository() as never)

    await expect(
      controller.handle({ actorId: 'abc' }, { profile: 'admin' } as never),
    ).rejects.toMatchObject({
      message: 'actorId must be a valid UUID.',
    })
  })

  it('returns not found when the details do not exist', async () => {
    const repository = makeRepository()
    repository.findById.mockResolvedValue(undefined)
    const controller = new ListAuditLogsController(repository as never)

    await expect(
      controller.getDetails('event-404', { profile: 'admin' } as never),
    ).rejects.toMatchObject({ message: 'Audit event not found.' })
  })
})

function makeRepository(): AuditLogsRepository & {
  list: ReturnType<typeof vi.fn>
  findById: ReturnType<typeof vi.fn>
} {
  const list = vi.fn().mockResolvedValue({ data: [], total: 0 })
  const findById = vi.fn()
  return { list, findById } as unknown as AuditLogsRepository & {
    list: ReturnType<typeof vi.fn>
    findById: ReturnType<typeof vi.fn>
  }
}

function makeEvent(): AuditEvent {
  return {
    id: 'event-1',
    occurredAt: new Date('2026-10-06T12:00:00.000Z'),
    entityType: 'third_party',
    action: 'created',
    origin: 'human',
    status: 'success',
  }
}
