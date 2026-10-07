import { describe, expect, it, vi } from 'vitest'

import type { AuditEvent } from '@hms/core/shared/domain/structures'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import type { AuditLogsRepository } from '@hms/core/shared/interfaces'

import { ExportAuditLogsController } from '@/shared/rest/controllers'

describe('ExportAuditLogsController', () => {
  it('exports CSV for an administrator and returns a downloadable response', async () => {
    const repository = makeRepository()
    const controller = new ExportAuditLogsController(repository as never)
    const response = makeResponse()

    await controller.handle(
      { format: 'csv', entityType: 'third_party' },
      collaborator('admin'),
      response as never,
    )

    expect(repository.list).toHaveBeenCalledWith({
      from: undefined,
      to: undefined,
      actorId: undefined,
      action: undefined,
      entityType: 'third_party',
      origin: undefined,
      status: undefined,
      page: 1,
      limit: 100,
    })
    expect(repository.recordExport).toHaveBeenCalledWith(
      expect.objectContaining({ actorProfile: 'admin', format: 'csv', exportedCount: 1 }),
    )
    expect(response.attachment).toHaveBeenCalledWith('audit-logs.csv')
    expect(response.send).toHaveBeenCalled()
  })

  it('rejects collaborators without audit export access', async () => {
    const controller = new ExportAuditLogsController(makeRepository() as never)

    await expect(
      controller.handle({}, collaborator('lawyer'), makeResponse() as never),
    ).rejects.toMatchObject({
      message: 'Only administrators and compliance supervisors can export audit logs.',
    })
  })
})

function collaborator(profile: 'admin' | 'lawyer'): CollaboratorSummary {
  return {
    collaboratorId: 'actor-1',
    professionalName: 'Test User',
    email: 'test@example.com',
    profile,
    status: 'active',
    ...(profile === 'lawyer' ? { legalExpertises: [] } : {}),
  } as CollaboratorSummary
}

function makeRepository(): AuditLogsRepository & {
  list: ReturnType<typeof vi.fn>
  recordExport: ReturnType<typeof vi.fn>
} {
  const event: AuditEvent = {
    id: 'event-1',
    occurredAt: new Date('2026-10-06T12:00:00.000Z'),
    actorId: 'actor-1',
    actorProfile: 'admin',
    entityType: 'third_party',
    entityId: 'third-party-1',
    action: 'created',
    origin: 'human',
    status: 'success',
  }
  const list = vi.fn().mockResolvedValue({ data: [event], total: 1 })
  const findById = vi.fn()
  const recordExport = vi.fn().mockResolvedValue(undefined)
  return { list, findById, recordExport } as unknown as AuditLogsRepository & {
    list: ReturnType<typeof vi.fn>
    recordExport: ReturnType<typeof vi.fn>
  }
}

function makeResponse() {
  const response = {
    status: vi.fn(),
    type: vi.fn(),
    attachment: vi.fn(),
    send: vi.fn(),
  }
  response.status.mockReturnValue(response)
  response.type.mockReturnValue(response)
  response.attachment.mockReturnValue(response)
  return response
}
