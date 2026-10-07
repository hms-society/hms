import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import type { AuditEvent } from '../../domain/structures'
import type { AuditLogsRepository } from '../../interfaces'
import { GetAuditLogDetailsUseCase } from '../get-audit-log-details-use-case'
import { ListAuditLogsUseCase } from '../list-audit-logs-use-case'

describe('Audit log use cases', () => {
  let repository: MockProxy<AuditLogsRepository>

  beforeEach(() => {
    repository = mock<AuditLogsRepository>()
  })

  it('lists audit events with the requested filters and pagination', async () => {
    const result = { data: [makeEvent()], total: 1 }
    repository.list.mockResolvedValue(result)
    const query = {
      page: 2,
      limit: 10,
      entityType: 'third_party' as const,
      origin: 'human' as const,
      status: 'success' as const,
    }

    await expect(new ListAuditLogsUseCase(repository).execute(query)).resolves.toEqual(
      result,
    )
    expect(repository.list).toHaveBeenCalledWith(query)
  })

  it('returns the selected audit event details', async () => {
    const event = makeEvent()
    repository.findById.mockResolvedValue(event)

    await expect(
      new GetAuditLogDetailsUseCase(repository).execute({ id: event.id }),
    ).resolves.toEqual(event)
    expect(repository.findById).toHaveBeenCalledWith(event.id)
  })

  it('preserves an absent audit event result', async () => {
    repository.findById.mockResolvedValue(undefined)

    await expect(
      new GetAuditLogDetailsUseCase(repository).execute({ id: 'missing' }),
    ).resolves.toBeUndefined()
  })
})

function makeEvent(): AuditEvent {
  return {
    id: 'event-1',
    occurredAt: new Date('2026-10-06T12:00:00.000Z'),
    actorId: 'actor-1',
    actorProfile: 'admin',
    entityType: 'third_party',
    entityId: 'third-party-1',
    action: 'permission_granted',
    origin: 'human',
    status: 'success',
    beforeData: null,
    afterData: { permission: 'view_case_status' },
  }
}
