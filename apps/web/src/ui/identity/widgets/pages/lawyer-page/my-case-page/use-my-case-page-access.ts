import { CollaboratorProfile, UserStatus } from '@hms/core/identity/domain/structures'
import { useCurrentCollaboratorQuery } from '@/ui/identity/hooks/use-current-collaborator-query'

const LEGAL_PROFILES = [
  CollaboratorProfile.Lawyer,
  CollaboratorProfile.Paralegal,
  CollaboratorProfile.Supervisor,
]

export function useMyCasePageAccess(isAdministrator: boolean) {
  const { currentCollaborator } = useCurrentCollaboratorQuery()
  const isActive = currentCollaborator?.status === UserStatus.Active
  const canReadAllCases = Boolean(
    isAdministrator &&
      isActive &&
      currentCollaborator?.profile === CollaboratorProfile.Admin,
  )
  const isLegalProfile = Boolean(
    currentCollaborator &&
      LEGAL_PROFILES.some((profile) => profile === currentCollaborator.profile),
  )
  return {
    currentCollaborator,
    canLoadLegalContent:
      canReadAllCases || Boolean(isActive && isLegalProfile && !isAdministrator),
  }
}
