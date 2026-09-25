import type { RestClient } from '@hms/core/shared/interfaces'
import { describe, expect, it, vi } from 'vitest'

import { CaseDocumentProductionService } from '../case-document-production-service'

describe('CaseDocumentProductionService', () => {
  it('persists edited version content through the case document endpoint', async () => {
    const restClient = makeRestClient()
    const service = CaseDocumentProductionService(restClient)
    const content = { type: 'doc' as const, content: [] }

    await service.saveEditedContent('case-1', 'document-1', 'version-1', content)

    expect(restClient.patch).toHaveBeenCalledWith(
      '/cases/case-1/documents/document-1/versions/version-1',
      content,
    )
  })
})

function makeRestClient(): RestClient {
  return {
    get: vi.fn().mockResolvedValue({ body: [] }),
    getFile: vi.fn(),
    post: vi.fn().mockResolvedValue({ body: {} }),
    postFormData: vi.fn(),
    patch: vi.fn().mockResolvedValue({ body: {} }),
    put: vi.fn(),
    delete: vi.fn(),
    setBaseUrl: vi.fn(),
    setHeader: vi.fn(),
    setAuthorization: vi.fn(),
    setQueryParam: vi.fn(),
    clearQueryParams: vi.fn(),
  }
}
