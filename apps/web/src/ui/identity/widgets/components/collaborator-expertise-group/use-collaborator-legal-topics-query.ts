import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { collaboratorQueryKeys } from '@/ui/identity/hooks/collaborator-query-keys'

export function useCollaboratorLegalTopicsQuery(legalAreaId?: string) {
  const { legalCatalogService } = useRestContext()

  async function fetchLegalTopics() {
    const response = await legalCatalogService.listLegalTopics(legalAreaId as string)

    if (response.isFailure) response.throwError()

    return response.body
  }

  const {
    data: legalTopics = [],
    error: legalTopicsError,
    isLoading: isLoadingLegalTopics,
  } = useQuery({
    queryKey: collaboratorQueryKeys.legalTopics(legalAreaId),
    queryFn: fetchLegalTopics,
    enabled: Boolean(legalAreaId),
  })

  return { legalTopics, legalTopicsError, isLoadingLegalTopics }
}
