import type { DynamicForm } from '@hms/core/shared/domain'
import type { RestClient } from '@hms/core/shared/interfaces'

export type ListDynamicFormsParams = {
  search?: string
  legalAreaId?: string
  legalTopicId?: string
  contextType?: string
}

export const DynamicFormService = (restClient: RestClient) => {
  return {
    listDynamicForms(params?: ListDynamicFormsParams) {
      const searchParams = new URLSearchParams()

      for (const [key, value] of Object.entries(params ?? {})) {
        if (value) searchParams.set(key, value)
      }

      const query = searchParams.toString()
      const url = query ? `/dynamic-forms?${query}` : '/dynamic-forms'

      return restClient.get<DynamicForm[]>(url)
    },
  }
}
