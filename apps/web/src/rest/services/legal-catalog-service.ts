import type {
  LegalArea,
  LegalAreaWithTopics,
  LegalTopic,
} from '@hms/core/legal-catalog/domain/entities'
import type { LegalCatalogService as LegalCatalogRestService } from '@hms/core/legal-catalog/interfaces'
import type { RestClient } from '@hms/core/shared/interfaces'

export const LegalCatalogService = (restClient: RestClient): LegalCatalogRestService => {
  return {
    createLegalArea(request) {
      return restClient.post<LegalArea>('/legal-catalog/admin/areas', request)
    },

    createLegalTopic(request) {
      return restClient.post<LegalTopic>('/legal-catalog/admin/topics', request)
    },

    listAdminLegalAreas() {
      return restClient.get<LegalAreaWithTopics[]>('/legal-catalog/admin/areas')
    },

    listLegalAreas() {
      return restClient.get<LegalArea[]>('/legal-catalog/areas')
    },

    listLegalTopics(legalAreaId) {
      return restClient.get<LegalTopic[]>(`/legal-catalog/areas/${legalAreaId}/topics`)
    },

    updateLegalArea(legalAreaId, request) {
      return restClient.patch<LegalArea>(
        `/legal-catalog/admin/areas/${legalAreaId}`,
        request,
      )
    },

    updateLegalTopic(legalTopicId, request) {
      return restClient.patch<LegalTopic>(
        `/legal-catalog/admin/topics/${legalTopicId}`,
        request,
      )
    },
  }
}
