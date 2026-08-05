import { describe, expect, it, vi } from 'vitest'
import type { RestClient } from '@hms/core/shared/interfaces'
import { RestResponse } from '@hms/core/shared/responses/rest-response'
import { DocumentProductionService } from '../document-production-service'

describe('DocumentProductionService', () => {
  it('lists document specifications with deterministic encoded filters', async () => {
    const response = new RestResponse({
      body: { items: [], page: 2, pageSize: 10, total: 0, totalPages: 0 },
    })
    const get = vi.fn<RestClient['get']>().mockResolvedValue(response)
    const service = DocumentProductionService({ get } as unknown as RestClient)
    const result = await service.listDocumentSpecifications({
      search: 'Procuração & contrato',
      legalAreaId: 'area-id',
      legalTopicId: 'topic-id',
      moment: 'consultation',
      status: 'available',
      page: 2,
      pageSize: 10,
    })
    expect(get).toHaveBeenCalledWith(
      '/document-specifications?search=Procura%C3%A7%C3%A3o+%26+contrato&legalAreaId=area-id&legalTopicId=topic-id&moment=consultation&status=available&page=2&pageSize=10',
    )
    expect(result).toBe(response)
  })
})
