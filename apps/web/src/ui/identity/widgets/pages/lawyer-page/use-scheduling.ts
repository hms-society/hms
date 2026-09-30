import { useQuery } from '@tanstack/react-query'

import { AppError } from '@hms/core/shared/domain/errors'

import { useCurrentCollaboratorQuery } from '@/ui/identity/hooks/use-current-collaborator-query'
import { useAuthContext } from '@/ui/shared/contexts/auth-context/use-auth-context'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export function useSchedule() {
  const { user } = useAuthContext()
  const { schedulingService } = useRestContext()
  const { currentCollaborator, currentCollaboratorError, isLoadingCurrentCollaborator } =
    useCurrentCollaboratorQuery()
  const collaboratorId = currentCollaborator?.collaboratorId

  const query = useQuery({
    queryKey: ['schedule', collaboratorId],
    enabled: !!user && !!collaboratorId,
    queryFn: async () => {
      if (!collaboratorId) {
        throw new AppError('Current collaborator is required')
      }

      const response = await schedulingService.getByCollaborator(collaboratorId)

      if (response.isFailure) {
        response.throwError()
      }

      return response.body
    },
  })

  return {
    schedule: query.data,
    isLoading: isLoadingCurrentCollaborator || query.isLoading,
    isError: Boolean(currentCollaboratorError) || query.isError,
    error: currentCollaboratorError ?? query.error,
    refetch: query.refetch,
  }
}
