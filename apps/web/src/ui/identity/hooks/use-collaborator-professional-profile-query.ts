import { useQuery, useQueryClient } from '@tanstack/react-query'

import { useCurrentCollaboratorQuery } from './use-current-collaborator-query'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export function useCollaboratorProfessionalProfileQuery(collaboratorId: string) {
  const queryClient = useQueryClient()
  const { identityService } = useRestContext()
  const { currentCollaborator } = useCurrentCollaboratorQuery()

  async function fetchProfessionalProfile() {
    const response =
      await identityService.getCollaboratorProfessionalProfile(collaboratorId)

    if (response.isFailure) {
      if (response.statusCode === 403) {
        void queryClient.removeQueries({
          queryKey: [
            'identity',
            'professional-profile',
            collaboratorId,
            currentCollaborator?.collaboratorId,
          ],
        })
      }
      response.throwError()
    }

    return response.body
  }

  const {
    data: professionalProfile = null,
    error: professionalProfileError,
    isLoading: isLoadingProfessionalProfile,
    refetch: refetchProfessionalProfile,
  } = useQuery({
    queryKey: [
      'identity',
      'professional-profile',
      collaboratorId,
      currentCollaborator?.collaboratorId,
    ],
    queryFn: fetchProfessionalProfile,
    enabled: Boolean(collaboratorId && currentCollaborator?.collaboratorId),
    retry: false,
  })

  function clearProfessionalProfile() {
    void queryClient.removeQueries({
      queryKey: [
        'identity',
        'professional-profile',
        collaboratorId,
        currentCollaborator?.collaboratorId,
      ],
    })
  }

  return {
    professionalProfile,
    professionalProfileError,
    isLoadingProfessionalProfile,
    refetchProfessionalProfile,
    clearProfessionalProfile,
  }
}
