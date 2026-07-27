import type { IdentityService as IdentityRestService } from '@hms/core/identity/interfaces'
import type { ClientDetails } from '@hms/core/identity/domain/entities'
import type { ClientConsent } from '@hms/core/identity/domain/entities'
import type { ConsentType } from '@hms/core/identity/domain/structures'
import type { RestClient } from '@hms/core/shared/interfaces'

export const IdentityService = (restClient: RestClient): IdentityRestService => {
  return {
    getClient(clientId) {
      return restClient.get<ClientDetails>(`/clients/${clientId}`)
    },

    lookupClient(request) {
      return restClient.post<ClientDetails>('/clients/lookup', request)
    },

    registerClient(request) {
      return restClient.post<ClientDetails>('/clients', request)
    },

    grantClientConsent(clientId: string, type: ConsentType) {
      return restClient.post<ClientConsent>(`/clients/${clientId}/consents`, { type })
    },
  }
}
