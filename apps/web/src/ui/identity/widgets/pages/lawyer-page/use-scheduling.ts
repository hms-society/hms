import { useQuery } from '@tanstack/react-query'

import { AppError } from '@hms/core/shared/domain/errors'

import { useCurrentCollaboratorQuery } from '@/ui/identity/hooks/use-current-collaborator-query'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export function useSchedule() {
  const { currentCollaborator } = useCurrentCollaboratorQuery()
  const { schedulingService } = useRestContext()
  const collaboratorId = currentCollaborator?.collaboratorId

  const query = useQuery({
    queryKey: ['schedule', collaboratorId],
    enabled: !!collaboratorId,
    queryFn: async () => {
      if (!collaboratorId) {
        throw new AppError('Authenticated collaborator is required')
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
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}
