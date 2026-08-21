import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export function getCollaboratorLegalTopicsQueryKey(legalAreaId?: string) {
  return ['identity', 'legal-catalog', 'topics', legalAreaId ?? null] as const
}

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
    queryKey: getCollaboratorLegalTopicsQueryKey(legalAreaId),
    queryFn: fetchLegalTopics,
    enabled: Boolean(legalAreaId),
  })

  return { legalTopics, legalTopicsError, isLoadingLegalTopics }
}
