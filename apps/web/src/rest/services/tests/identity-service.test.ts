import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ClientConsent, ClientDetails } from '@hms/core/identity/domain/entities'
import type { RestClient } from '@hms/core/shared/interfaces'
import { RestResponse } from '@hms/core/shared/responses/rest-response'

import { IdentityService } from '../identity-service'

describe('IdentityService', () => {
  let restClient: RestClient
  let getMock: ReturnType<typeof vi.fn>
  let postMock: ReturnType<typeof vi.fn>
  const clientDetails = {} as ClientDetails
  const clientConsent = {} as ClientConsent

  beforeEach(() => {
    getMock = vi.fn().mockResolvedValue(new RestResponse({ body: clientDetails }))
    postMock = vi.fn().mockResolvedValue(new RestResponse({ body: clientDetails }))
    restClient = { get: getMock, post: postMock } as unknown as RestClient
  })

  it('maps lookup, registration, get, and consent grant to the Identity routes', async () => {
    const service = IdentityService(restClient)
    postMock.mockResolvedValueOnce(new RestResponse({ body: clientDetails }))
    postMock.mockResolvedValueOnce(new RestResponse({ body: clientDetails }))
    postMock.mockResolvedValueOnce(new RestResponse({ body: clientConsent }))

    await service.lookupClient({ taxId: '52998224725' })
    await service.registerClient({ type: 'natural', name: 'Maria', taxId: '52998224725' })
    await service.getClient('client-id')
    await service.grantClientConsent('client-id', 'data_processing')

    expect(postMock).toHaveBeenNthCalledWith(1, '/clients/lookup', {
      taxId: '52998224725',
    })
    expect(postMock).toHaveBeenNthCalledWith(2, '/clients', {
      type: 'natural',
      name: 'Maria',
      taxId: '52998224725',
    })
    expect(getMock).toHaveBeenCalledWith('/clients/client-id')
    expect(postMock).toHaveBeenNthCalledWith(3, '/clients/client-id/consents', {
      type: 'data_processing',
    })
  })
})
