import { describe, expect, it, vi } from 'vitest'
import type { RestClient } from '@hms/core/shared/interfaces'

import { CaseManagementService } from '../case-management-service'

describe('CaseManagementService', () => {
  it('generates a case portal link with upload permission', async () => {
    const restClient = makeRestClient()
    const service = CaseManagementService(restClient)

    await service.grantCasePortalAccess('case-1', { canUpload: true })

    expect(restClient.post).toHaveBeenCalledWith('/cases/case-1/portal-access', {
      canUpload: true,
    })
  })
})

function makeRestClient(): RestClient {
  return {
    get: vi.fn(),
    getFile: vi.fn(),
    post: vi.fn().mockResolvedValue({ body: {} }),
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
