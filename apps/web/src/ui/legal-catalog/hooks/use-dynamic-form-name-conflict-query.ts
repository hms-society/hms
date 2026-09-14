import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export const DYNAMIC_FORM_NAME_CONFLICT_QUERY_KEY = [
  'legal-catalog',
  'dynamic-form-name-conflict',
] as const

export function useDynamicFormNameConflictQuery(name: string, enabled = true) {
  const { legalCatalogService } = useRestContext()
  const normalizedName = name.trim()

  async function findConflict() {
    const response = await legalCatalogService.findDynamicFormNameConflict(normalizedName)
    if (response.isFailure) response.throwError()
    return response.body
  }

  return useQuery({
    queryKey: [...DYNAMIC_FORM_NAME_CONFLICT_QUERY_KEY, normalizedName],
    queryFn: findConflict,
    enabled: enabled && normalizedName.length > 0,
    retry: false,
  })
}
