import type {
  CaseEligibleCollaborator,
  CaseMemberRole as CaseMemberRoleType,
} from '@hms/core/case-management/domain/structures'
import { toast } from 'sonner'

export function useCreateCaseTeamSelection(actions: {
  append: (value: { collaboratorId: string; role: CaseMemberRoleType }) => void
  remove: (index: number) => void
  setManager: (manager: CaseEligibleCollaborator | null) => void
  setManagerId: (id: string) => void
  setInitialManagerOpen: (open: boolean) => void
  setTeamOpen: (open: boolean) => void
  manager: CaseEligibleCollaborator | null
  teamMembers: CaseEligibleCollaborator[]
  setTeamMembers: (
    update: (members: CaseEligibleCollaborator[]) => CaseEligibleCollaborator[],
  ) => void
}) {
  function handleIntakeSelect(intakeId: string, onChange: (value: string) => void) {
    onChange(intakeId)
    actions.setManager(null)
    actions.setManagerId('')
  }

  function handleInitialManagerSelect(collaborator: CaseEligibleCollaborator) {
    actions.setManager(collaborator)
    actions.setManagerId(collaborator.collaboratorId)
  }

  function handleTeamMemberSelect(
    collaborator: CaseEligibleCollaborator,
    role: CaseMemberRoleType,
  ) {
    const duplicate =
      collaborator.collaboratorId === actions.manager?.collaboratorId ||
      actions.teamMembers.some(
        (member) => member.collaboratorId === collaborator.collaboratorId,
      )
    if (duplicate) {
      toast.error('Esta pessoa já está selecionada para a equipe inicial.')
      return
    }
    actions.append({ collaboratorId: collaborator.collaboratorId, role })
    actions.setTeamMembers((members) => [...members, collaborator])
  }

  function handleRemoveTeamMember(index: number) {
    actions.remove(index)
    actions.setTeamMembers((members) =>
      members.filter((_, memberIndex) => memberIndex !== index),
    )
  }

  function handleInitialManagerSelectorClose() {
    actions.setInitialManagerOpen(false)
  }
  function handleTeamSelectorClose() {
    actions.setTeamOpen(false)
  }

  return {
    handleIntakeSelect,
    handleInitialManagerSelect,
    handleTeamMemberSelect,
    handleRemoveTeamMember,
    handleInitialManagerSelectorClose,
    handleTeamSelectorClose,
  }
}
