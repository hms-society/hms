import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { collaboratorQueryKeys } from './collaborator-query-keys'

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
    queryKey: collaboratorQueryKeys.legalAreas,
    queryFn: fetchLegalAreas,
  })

  return { legalAreas, legalAreasError, isLoadingLegalAreas }
}
