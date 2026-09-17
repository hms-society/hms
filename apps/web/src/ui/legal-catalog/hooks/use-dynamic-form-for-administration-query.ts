import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export const DYNAMIC_FORM_FOR_ADMINISTRATION_QUERY_KEY = [
  'legal-catalog',
  'dynamic-form',
  'administration',
] as const

export function getDynamicFormForAdministrationQueryKey(dynamicFormId: string) {
  return [...DYNAMIC_FORM_FOR_ADMINISTRATION_QUERY_KEY, dynamicFormId] as const
}

export function useDynamicFormForAdministrationQuery(
  dynamicFormId: string | undefined,
  enabled = true,
) {
  const { legalCatalogService } = useRestContext()
  return useQuery({
    queryKey: getDynamicFormForAdministrationQueryKey(dynamicFormId ?? 'invalid'),
    queryFn: async () => {
      if (!dynamicFormId) throw new Error('Identificador inválido.')
      const response =
        await legalCatalogService.getDynamicFormForAdministration(dynamicFormId)
      if (response.isFailure) response.throwError()
      return response.body
    },
    enabled: enabled && Boolean(dynamicFormId),
    retry: false,
  })
}
