import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export const THIRD_PARTIES_QUERY_KEY = ['identity', 'third-parties'] as const

export function useThirdPartiesQuery() {
  const { identityService } = useRestContext()

  async function fetchThirdParties() {
    const response = await identityService.listThirdParties()
    if (response.isFailure) response.throwError()
    return response.body
  }

  const {
    data: thirdParties = [],
    error: thirdPartiesError,
    isLoading: isLoadingThirdParties,
    refetch,
  } = useQuery({
    queryKey: THIRD_PARTIES_QUERY_KEY,
    queryFn: fetchThirdParties,
  })

  return { thirdParties, thirdPartiesError, isLoadingThirdParties, refetch }
}
