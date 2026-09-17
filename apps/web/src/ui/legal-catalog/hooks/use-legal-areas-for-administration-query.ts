import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export function useLegalAreasForAdministrationQuery() {
  const { legalCatalogService } = useRestContext()
  return useQuery({
    queryKey: ['legal-catalog', 'areas', 'administration'],
    queryFn: async () => {
      const response = await legalCatalogService.listLegalAreas()
      if (response.isFailure) response.throwError()
      return response.body
    },
    retry: false,
  })
}
