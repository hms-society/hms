import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

const COLLABORATOR_LEGAL_AREAS_QUERY_KEY = ['identity', 'legal-catalog', 'areas'] as const

export function useCollaboratorLegalAreasQuery() {
  const { legalCatalogService } = useRestContext()

  async function fetchLegalAreas() {
    const response = await legalCatalogService.listLegalAreas()

    if (response.isFailure) response.throwError()

    return response.body
  }

  const {
    data: legalAreas = [],
    error: legalAreasError,
    isLoading: isLoadingLegalAreas,
  } = useQuery({
    queryKey: COLLABORATOR_LEGAL_AREAS_QUERY_KEY,
    queryFn: fetchLegalAreas,
  })

  return { legalAreas, legalAreasError, isLoadingLegalAreas }
}
