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
  DynamicFormEditorDetails,
} from '@hms/core/legal-catalog/domain/structures'
import type { LegalCatalogService as LegalCatalogRestService } from '@hms/core/legal-catalog/interfaces'
import type { RestClient } from '@hms/core/shared/interfaces'

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

function createReferenceOperations(
  restClient: RestClient,
): Pick<LegalCatalogRestService, 'listLegalAreas' | 'listLegalTopics'> {
  return {
    listLegalAreas() {
      return restClient.get<LegalArea[]>('/legal-catalog/areas')
    },

    listLegalTopics(legalAreaId) {
      return restClient.get<LegalTopic[]>(`/legal-catalog/areas/${legalAreaId}/topics`)
    },
  }
}

function createAdministrationOperations(
  restClient: RestClient,
): Pick<
  LegalCatalogRestService,
  | 'listDynamicFormsForAdministration'
  | 'findDynamicFormNameConflict'
  | 'duplicateDynamicForm'
  | 'getDynamicFormUsageImpact'
  | 'changeDynamicFormAvailability'
  | 'deleteDynamicForm'
> {
  return {
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

function createEditorOperations(
  restClient: RestClient,
): Pick<
  LegalCatalogRestService,
  | 'getDynamicFormForAdministration'
  | 'createDynamicForm'
  | 'updateDynamicForm'
  | 'getDynamicFormFieldUsageImpact'
> {
  return {
    getDynamicFormForAdministration(dynamicFormId) {
      return restClient.get<DynamicFormEditorDetails>(
        `/legal-catalog/dynamic-forms/${dynamicFormId}`,
      )
    },

    createDynamicForm(input) {
      return restClient.post<DynamicForm>('/legal-catalog/dynamic-forms', input)
    },

    updateDynamicForm(dynamicFormId, input) {
      return restClient.put<DynamicForm>(
        `/legal-catalog/dynamic-forms/${dynamicFormId}`,
        input,
      )
    },

    getDynamicFormFieldUsageImpact(dynamicFormId, fieldId) {
      return restClient.get<DynamicFormUsageImpact>(
        `/legal-catalog/dynamic-forms/${dynamicFormId}/fields/${fieldId}/impact`,
      )
    },
  }
}

export const LegalCatalogService = (restClient: RestClient): LegalCatalogRestService => ({
  ...createReferenceOperations(restClient),
  ...createAdministrationOperations(restClient),
  ...createEditorOperations(restClient),
})
