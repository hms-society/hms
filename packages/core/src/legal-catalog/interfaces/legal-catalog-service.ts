import type { RestResponse } from '#shared/responses/rest-response.ts'

import type {
  LegalArea,
  LegalAreaCreation,
  LegalAreaUpdate,
  LegalAreaWithTopics,
  LegalTopic,
  LegalTopicCreation,
  LegalTopicUpdate,
} from '../domain/entities'

export interface LegalCatalogService {
  createLegalArea(request: LegalAreaCreation): Promise<RestResponse<LegalArea>>
  createLegalTopic(request: LegalTopicCreation): Promise<RestResponse<LegalTopic>>
  listAdminLegalAreas(): Promise<RestResponse<LegalAreaWithTopics[]>>
  listLegalAreas(): Promise<RestResponse<LegalArea[]>>
  listLegalTopics(legalAreaId: string): Promise<RestResponse<LegalTopic[]>>
  updateLegalArea(
    legalAreaId: string,
    request: LegalAreaUpdate,
  ): Promise<RestResponse<LegalArea>>
  updateLegalTopic(
    legalTopicId: string,
    request: LegalTopicUpdate,
  ): Promise<RestResponse<LegalTopic>>
}
