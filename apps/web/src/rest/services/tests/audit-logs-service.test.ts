import type { RestClient } from '@hms/core/shared/interfaces'
import { describe, expect, it, vi } from 'vitest'

import { AuditLogsService } from '../audit-logs-service'

describe('AuditLogsService', () => {
  it('maps list filters to the audit log query string', async () => {
    const restClient = makeRestClient()
    const service = AuditLogsService(restClient)

    await service.list({
      page: 2,
      limit: 20,
      from: '2026-10-01T00:00:00.000Z',
      to: '2026-10-06T23:59:59.999Z',
      entityType: 'third_party',
      origin: 'human',
      status: 'success',
      action: 'permission_granted',
    })

    expect(restClient.get).toHaveBeenCalledWith(
      '/audit-logs?page=2&limit=20&from=2026-10-01T00%3A00%3A00.000Z&to=2026-10-06T23%3A59%3A59.999Z&entityType=third_party&action=permission_granted&origin=human&status=success',
    )
  })

  it('requests an audit event by id', async () => {
    const restClient = makeRestClient()
    const service = AuditLogsService(restClient)

    await service.getDetails('event-1')

    expect(restClient.get).toHaveBeenCalledWith('/audit-logs/event-1')
  })
})

function makeRestClient(): RestClient {
  return {
    get: vi.fn().mockResolvedValue({ body: {} }),
    getFile: vi.fn(),
    post: vi.fn(),
    postFormData: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    setBaseUrl: vi.fn(),
    setHeader: vi.fn(),
    setAuthorization: vi.fn(),
    setQueryParam: vi.fn(),
    clearQueryParams: vi.fn(),
  }
}
