import { useQuery } from '@tanstack/react-query'

import { AppError } from '@hms/core/shared/domain/errors'

import { useAuthContext } from '@/ui/shared/contexts/auth-context/use-auth-context'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export function useSchedule() {
  const { user } = useAuthContext()
  const { schedulingService } = useRestContext()

  const query = useQuery({
    queryKey: ['schedule', user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) {
        throw new AppError('Authenticated user is required')
      }

      const response = await schedulingService.getByCollaborator(user.id)

      if (response.isFailure) {
        response.throwError()
      }

      return response.body
    },
  })

  return {
    schedule: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}
