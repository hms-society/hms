import { describe, expect, it, vi } from 'vitest'
import type { RestClient } from '@hms/core/shared/interfaces'

import { LegalCatalogService } from '../legal-catalog-service'

describe('LegalCatalogService', () => {
  it('uses admin endpoints for legal area and demand type management', async () => {
    const restClient = makeRestClient()
    const service = LegalCatalogService(restClient)

    await service.listAdminLegalAreas()
    await service.createLegalArea({ name: 'Cível', active: true })
    await service.updateLegalArea('area-civil', { name: 'Civil', active: false })
    await service.createLegalTopic({
      legalAreaId: 'area-civil',
      name: 'Contratos',
      active: true,
    })
    await service.updateLegalTopic('topic-contracts', {
      name: 'Revisão contratual',
      active: false,
    })

    expect(restClient.get).toHaveBeenCalledWith('/legal-catalog/admin/areas')
    expect(restClient.post).toHaveBeenCalledWith('/legal-catalog/admin/areas', {
      name: 'Cível',
      active: true,
    })
    expect(restClient.patch).toHaveBeenCalledWith(
      '/legal-catalog/admin/areas/area-civil',
      { name: 'Civil', active: false },
    )
    expect(restClient.post).toHaveBeenCalledWith('/legal-catalog/admin/topics', {
      legalAreaId: 'area-civil',
      name: 'Contratos',
      active: true,
    })
    expect(restClient.patch).toHaveBeenCalledWith(
      '/legal-catalog/admin/topics/topic-contracts',
      { name: 'Revisão contratual', active: false },
    )
  })

  it('uses public catalog endpoints for active legal areas and topics', async () => {
    const restClient = makeRestClient()
    const service = LegalCatalogService(restClient)

    await service.listLegalAreas()
    await service.listLegalTopics('area-civil')

    expect(restClient.get).toHaveBeenCalledWith('/legal-catalog/areas')
    expect(restClient.get).toHaveBeenCalledWith('/legal-catalog/areas/area-civil/topics')
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
