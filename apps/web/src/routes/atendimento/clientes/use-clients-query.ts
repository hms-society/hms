import { useQuery } from '@tanstack/react-query'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export interface ListClientsParams {
  page: number
  limit: number
  search?: string
}

export function useClientsQuery(params: ListClientsParams) {
  const { identityService } = useRestContext()

  return useQuery({
    queryKey: ['clients', params],
    queryFn: async () => {
      const response = await identityService.listClients(params)
      if (response.isFailure) response.throwError()
      return response.body
    },
  })
}