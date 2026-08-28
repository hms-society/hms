import { useInfiniteQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

const LAWYERS_PAGE_LIMIT = 10

export const useIntakeLawyersQuery = (search: string, enabled: boolean) => {
  const { identityService } = useRestContext()
  const {
    data,
    error: intakeLawyersError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingIntakeLawyers,
    refetch: refetchIntakeLawyers,
  } = useInfiniteQuery({
    queryKey: ['intake-lawyers', { search }],
    queryFn: async function fetchLawyers({ pageParam }) {
      const response = await identityService.listLawyers({
        page: pageParam,
        limit: LAWYERS_PAGE_LIMIT,
        search: search.trim() || undefined,
      })

      if (response.isFailure) response.throwError()

      return response.body
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    enabled,
  })

  return {
    hasNextPage,
    intakeLawyerPages: data?.pages ?? [],
    intakeLawyersError,
    isFetchingNextPage,
    isLoadingIntakeLawyers,
    fetchNextPage,
    refetchIntakeLawyers,
  }
}
