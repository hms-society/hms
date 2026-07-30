import { RestResponse } from '@hms/core/shared/responses/rest-response'
import type { ClientDetails } from '@hms/core/identity/domain/entities'
import type { ConsentType } from '@hms/core/identity/domain/structures'

export interface IdentityService {
  lookupClient(criteria: { taxId?: string; phone?: string }): Promise<RestResponse<ClientDetails>>
  getClient(clientId: string): Promise<RestResponse<ClientDetails>>
  registerClient(request: unknown): Promise<RestResponse<ClientDetails>>
  grantClientConsent(clientId: string, type: ConsentType): Promise<RestResponse<unknown>>
  listClients(params: {
    page: number
    limit: number
    search?: string
  }): Promise<RestResponse<{ data: unknown[]; total: number; page: number; limit: number }>>
}

export const IdentityService = (restClient: any): IdentityService => ({
  async lookupClient(criteria) {
    return restClient.post('/clients/lookup', criteria)
  },

  async getClient(clientId) {
    return restClient.get(`/clients/${clientId}`)
  },

  async registerClient(request) {
    return restClient.post('/clients', request)
  },

  async grantClientConsent(clientId, type) {
    return restClient.post(`/clients/${clientId}/consents`, { type })
  },

  async listClients(params) {
    const searchParams = new URLSearchParams()
    searchParams.append('page', params.page.toString())
    searchParams.append('limit', params.limit.toString())
    if (params.search) {
      searchParams.append('search', params.search)
    }

    return restClient.get(`/clients?${searchParams.toString()}`)
  },
})