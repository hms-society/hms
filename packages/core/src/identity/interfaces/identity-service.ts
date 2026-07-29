import type { RestResponse } from '#shared/responses/rest-response.ts'

import type { ClientConsent, ClientDetails } from '../domain/entities'
import type { ConsentType } from '../domain/structures'
import type { LookupClientRequest, RegisterClientRequest } from '../use-cases'

export interface IdentityService {
  getClient(clientId: string): Promise<RestResponse<ClientDetails>>
  lookupClient(request: LookupClientRequest): Promise<RestResponse<ClientDetails>>
  registerClient(request: RegisterClientRequest): Promise<RestResponse<ClientDetails>>
  grantClientConsent(
    clientId: string,
    type: ConsentType,
  ): Promise<RestResponse<ClientConsent>>
}
