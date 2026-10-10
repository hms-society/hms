import type { RefObject } from 'react'

import type {
  CaseMemberRole,
  CaseEligibleCollaborator,
} from '@hms/core/case-management/domain/structures'
import type { CollaboratorProfile } from '@hms/core/identity/domain/structures'

export type CaseTeamMemberSelectorProps = {
  open: boolean
  caseId?: string
  triggerRef?: RefObject<HTMLButtonElement | null>
  onClose: () => void
  onSelect: (collaborator: CaseEligibleCollaborator, role: CaseMemberRole) => void
  initialRole?: CaseMemberRole
  allowedRoles?: readonly CaseMemberRole[]
  requiredProfile?: CollaboratorProfile
}
