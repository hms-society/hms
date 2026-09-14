import type { DynamicForm } from '@hms/core/shared/domain'
import type { RestClient } from '@hms/core/shared/interfaces'
import { RestResponse } from '@hms/core/shared/responses/rest-response'

export type ListDynamicFormsParams = {
  search?: string
  legalAreaId?: string
  legalTopicId?: string
  contextType?: string
}

type CanonicalDynamicFormResponse = {
  id: string
  name: string
  description?: string | null
  status: DynamicForm['status']
  fields: DynamicForm['fields']
  createdAt: Date
  updatedAt: Date
  contexts?: DynamicForm['contexts']
  legalAreaId?: string
  legalTopicIds?: string[]
  normalizedName?: string
}

function toLegacyDynamicForm(response: CanonicalDynamicFormResponse): DynamicForm {
  if (response.contexts) return response as DynamicForm

  return {
    id: response.id,
    name: response.name,
    description: response.description ?? undefined,
    status: response.status,
    contexts: [
      ...(response.legalAreaId
        ? [{ type: 'legal_area', data: { legalAreaId: response.legalAreaId } }]
        : []),
      ...(response.legalTopicIds
        ? [{ type: 'legal_topics', data: { legalTopicIds: response.legalTopicIds } }]
        : []),
    ],
    fields: response.fields,
    createdAt: response.createdAt,
    updatedAt: response.updatedAt,
  }
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

      return restClient.get<CanonicalDynamicFormResponse[]>(url).then((response) => {
        if (response.isFailure) {
          return new RestResponse<DynamicForm[]>({
            statusCode: response.statusCode,
            errorMessage: response.errorMessage,
            headers: response.headers,
          })
        }

        return new RestResponse<DynamicForm[]>({
          body: response.body.map(toLegacyDynamicForm),
          statusCode: response.statusCode,
          headers: response.headers,
        })
      })
    },
  }
}
