import type {
  DynamicForm,
  LegalArea,
  LegalTopic,
} from '@hms/core/legal-catalog/domain/entities'
import type {
  DynamicFormListQuery,
  DynamicFormListResult,
  DynamicFormStatus,
  DynamicFormUsageImpact,
  FindDynamicFormNameConflictResult,
} from '@hms/core/legal-catalog/domain/structures'
import type { LegalCatalogService as LegalCatalogRestService } from '@hms/core/legal-catalog/interfaces'
import type { RestClient } from '@hms/core/shared/interfaces'

export const LegalCatalogService = (restClient: RestClient): LegalCatalogRestService => {
  function createAdministrationPath(query: DynamicFormListQuery) {
    const searchParams = new URLSearchParams()
    const entries: Array<[string, string | number | undefined]> = [
      ['search', query.search],
      ['stage', query.stage],
      ['status', query.status],
      ['page', query.page],
      ['pageSize', query.pageSize],
    ]

    for (const [key, value] of entries) {
      if (value !== undefined) searchParams.set(key, String(value))
    }

    return `/legal-catalog/dynamic-forms?${searchParams.toString()}`
  }

  return {
    listLegalAreas() {
      return restClient.get<LegalArea[]>('/legal-catalog/areas')
    },

    listLegalTopics(legalAreaId) {
      return restClient.get<LegalTopic[]>(`/legal-catalog/areas/${legalAreaId}/topics`)
    },

    listDynamicFormsForAdministration(query) {
      return restClient.get<DynamicFormListResult>(createAdministrationPath(query))
    },

    findDynamicFormNameConflict(name) {
      const params = new URLSearchParams({ name })
      return restClient.get<FindDynamicFormNameConflictResult>(
        `/legal-catalog/dynamic-form-name-conflicts?${params.toString()}`,
      )
    },

    duplicateDynamicForm(dynamicFormId, input) {
      return restClient.post<DynamicForm>(
        `/legal-catalog/dynamic-forms/${dynamicFormId}/duplicates`,
        input,
      )
    },

    getDynamicFormUsageImpact(dynamicFormId) {
      return restClient.get<DynamicFormUsageImpact>(
        `/legal-catalog/dynamic-forms/${dynamicFormId}/impact`,
      )
    },

    changeDynamicFormAvailability(dynamicFormId, input: { status: DynamicFormStatus }) {
      return restClient.patch<DynamicForm>(
        `/legal-catalog/dynamic-forms/${dynamicFormId}/availability`,
        input,
      )
    },

    deleteDynamicForm(dynamicFormId) {
      return restClient.delete<void>(`/legal-catalog/dynamic-forms/${dynamicFormId}`)
    },
  }
}
