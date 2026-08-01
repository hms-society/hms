import { useQuery } from '@tanstack/react-query'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

type UseClientsQueryProps = {
  page: number
  limit: number
  search?: string
}

export function useClientsQuery({ page, limit, search }: UseClientsQueryProps) {
  const { identityService } = useRestContext()

  return useQuery({
    queryKey: ['clients', { page, limit, search }],
    queryFn: async () => {
      const response = await identityService.listClients({ page, limit, search })
      if (response.isFailure) response.throwError()
      return response.body
    },
  })
}
