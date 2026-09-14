import type { DynamicFormListQuery } from '@hms/core/legal-catalog/domain/structures'
import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export const DYNAMIC_FORMS_ADMINISTRATION_QUERY_KEY = [
  'legal-catalog',
  'dynamic-forms',
] as const

export function getDynamicFormsAdministrationQueryKey(query: DynamicFormListQuery) {
  return [
    ...DYNAMIC_FORMS_ADMINISTRATION_QUERY_KEY,
    'list',
    query.search ?? '',
    query.stage ?? null,
    query.status ?? null,
    query.page,
    query.pageSize,
  ] as const
}

export function useDynamicFormsAdministrationQuery(query: DynamicFormListQuery) {
  const { legalCatalogService } = useRestContext()

  async function fetchDynamicForms() {
    const response = await legalCatalogService.listDynamicFormsForAdministration(query)
    if (response.isFailure) response.throwError()
    return response.body
  }

  return useQuery({
    queryKey: getDynamicFormsAdministrationQueryKey(query),
    queryFn: fetchDynamicForms,
    retry: false,
  })
}
