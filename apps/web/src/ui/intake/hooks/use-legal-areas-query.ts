import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export function useLegalAreasQuery() {
  const { legalCatalogService } = useRestContext()
  const {
    data: legalAreas = [],
    error: legalAreasError,
    isLoading: isLoadingLegalAreas,
  } = useQuery({
    queryKey: ['legal-catalog', 'areas'],
    queryFn: async function fetchLegalAreas() {
      const response = await legalCatalogService.listLegalAreas()

      if (response.isFailure) response.throwError()

      return response.body
    },
  })

  return { legalAreas, legalAreasError, isLoadingLegalAreas }
}
