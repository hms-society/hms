import { COLLABORATOR_PROFILE_LABELS } from '../collaborators-page/collaborators-page-constants'
import { useCollaboratorProfessionalProfileQuery } from '@/ui/identity/hooks/use-collaborator-professional-profile-query'

export function useCollaboratorProfessionalProfilePage(collaboratorId: string) {
  const {
    clearProfessionalProfile,
    isLoadingProfessionalProfile,
    professionalProfile,
    professionalProfileError,
    refetchProfessionalProfile,
  } = useCollaboratorProfessionalProfileQuery(collaboratorId)

  function getProfileLabel(profile: string) {
    return COLLABORATOR_PROFILE_LABELS[profile] ?? profile
  }

  return {
    clearProfessionalProfile,
    getProfileLabel,
    isLoadingProfessionalProfile,
    professionalProfile,
    professionalProfileError,
    refetchProfessionalProfile,
  }
}
