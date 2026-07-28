import { describe, expect, it, vi } from 'vitest'

import { LegalCatalogService } from '../legal-catalog-service'

describe('LegalCatalogService', () => {
  it('lists legal areas from the catalog endpoint', async () => {
    const get = vi.fn().mockResolvedValue({ body: [], isFailure: false })
    const service = LegalCatalogService({ get } as never)

    await service.listLegalAreas()

    expect(get).toHaveBeenCalledWith('/legal-catalog/areas')
  })

  it('lists topics for the selected legal area', async () => {
    const get = vi.fn().mockResolvedValue({ body: [], isFailure: false })
    const service = LegalCatalogService({ get } as never)

    await service.listLegalTopics('area-id')

    expect(get).toHaveBeenCalledWith('/legal-catalog/areas/area-id/topics')
  })
})
