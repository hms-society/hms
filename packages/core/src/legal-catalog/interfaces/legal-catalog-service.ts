import type { RestResponse } from '#shared/responses/rest-response.ts'

import type { LegalArea, LegalTopic } from '../domain/entities'

export interface LegalCatalogService {
  listLegalAreas(): Promise<RestResponse<LegalArea[]>>
  listLegalTopics(legalAreaId: string): Promise<RestResponse<LegalTopic[]>>
}
