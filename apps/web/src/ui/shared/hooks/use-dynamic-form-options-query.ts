import { useQuery } from '@tanstack/react-query'

import type { DynamicForm } from '@hms/core/shared/domain'

import { useRestContext } from './use-rest-context'

export type LegalAreaOption = {
  id: string
  name: string
}

export type LegalTopicOption = {
  id: string
  legalAreaId?: string
  name: string
}

export type DynamicFormOptionsQueryInput = {
  contextType?: string
  enabled: boolean
  legalAreaId: string
  legalTopicId: string
  search: string
}

export const useDynamicFormOptionsQuery = ({
  contextType,
  enabled,
  legalAreaId,
  legalTopicId,
  search,
}: DynamicFormOptionsQueryInput) => {
  const { dynamicFormService, legalCatalogService } = useRestContext()
  const { data: legalAreas = [] } = useQuery({
    queryKey: ['legal-areas'],
    queryFn: async () => {
      const response = await legalCatalogService.listLegalAreas()

      if (response.isFailure) return []

      return (response.body as LegalAreaOption[]) ?? []
    },
    enabled,
  })
  const { data: legalTopics = [] } = useQuery({
    queryKey: ['legal-topics', legalAreaId],
    queryFn: async () => {
      if (!legalAreaId) return []

      const response = await legalCatalogService.listLegalTopics(legalAreaId)

      if (response.isFailure) return []

      return (response.body as LegalTopicOption[]) ?? []
    },
    enabled: enabled && Boolean(legalAreaId),
  })
  const {
    data: dynamicForms = [],
    isError: isDynamicFormsError,
    isLoading: isLoadingDynamicForms,
  } = useQuery({
    queryKey: ['dynamic-forms', contextType, search, legalAreaId, legalTopicId],
    queryFn: async () => {
      const response = await dynamicFormService.listDynamicForms({
        search,
        legalAreaId,
        legalTopicId,
        contextType,
      })

      if (response.isFailure) response.throwError()

      return (response.body as DynamicForm[]) ?? []
    },
    enabled,
  })

  return {
    dynamicForms,
    isDynamicFormsError,
    isLoadingDynamicForms,
    legalAreas,
    legalTopics,
  }
}
