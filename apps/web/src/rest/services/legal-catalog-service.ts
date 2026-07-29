import type { LegalArea, LegalTopic } from '@hms/core/legal-catalog/domain/entities'
import type { LegalCatalogService as LegalCatalogRestService } from '@hms/core/legal-catalog/interfaces'
import type { RestClient } from '@hms/core/shared/interfaces'

export const LegalCatalogService = (restClient: RestClient): LegalCatalogRestService => {
  return {
    listLegalAreas() {
      return restClient.get<LegalArea[]>('/legal-catalog/areas')
    },

    listLegalTopics(legalAreaId) {
      return restClient.get<LegalTopic[]>(`/legal-catalog/areas/${legalAreaId}/topics`)
    },
  }
}
