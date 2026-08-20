import { describe, expect, it, vi } from 'vitest'
import type { RestClient } from '@hms/core/shared/interfaces'
import { RestResponse } from '@hms/core/shared/responses/rest-response'
import { DocumentProductionService } from '../document-production-service'

describe('DocumentProductionService', () => {
  it('maps list filters to the document specifications endpoint', async () => {
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

  it('maps create and get operations without adding transport concerns', async () => {
    const response = new RestResponse()
    const post = vi.fn<RestClient['post']>().mockResolvedValue(response)
    const get = vi.fn<RestClient['get']>().mockResolvedValue(response)
    const service = DocumentProductionService({ post, get } as unknown as RestClient)
    const request = {
      name: 'Procuração',
      description: 'Representação',
      application: { scope: 'global' as const, moment: 'consultation' as const },
    }

    await expect(service.createDocumentSpecification(request)).resolves.toBe(response)
    await expect(service.getDocumentSpecification('specification-id')).resolves.toBe(
      response,
    )

    expect(post).toHaveBeenCalledWith('/document-specifications', request)
    expect(get).toHaveBeenCalledWith('/document-specifications/specification-id')
  })

  it('maps configuration and template updates to independent PATCH endpoints', async () => {
    const response = new RestResponse()
    const patch = vi.fn<RestClient['patch']>().mockResolvedValue(response)
    const service = DocumentProductionService({ patch } as unknown as RestClient)
    const configuration = {
      name: 'Procuração atualizada',
      description: 'Representação atualizada',
      status: 'unavailable' as const,
      application: { scope: 'global' as const, moment: 'consultation' as const },
    }
    const template = {
      content: { type: 'doc' as const, content: [{ type: 'paragraph' as const }] },
      variables: [],
    }

    await expect(
      service.updateDocumentSpecificationConfiguration('specification-id', configuration),
    ).resolves.toBe(response)
    await expect(
      service.updateDocumentSpecificationTemplate('specification-id', template),
    ).resolves.toBe(response)

    expect(patch).toHaveBeenNthCalledWith(
      1,
      '/document-specifications/specification-id/configuration',
      configuration,
    )
    expect(patch).toHaveBeenNthCalledWith(
      2,
      '/document-specifications/specification-id/template',
      template,
    )
  })
})
