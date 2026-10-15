import type { CreateCaseData } from '@hms/validation/case-management'
import { useCreateCaseLookups } from './use-create-case-lookups'
import { useCreateCasePageState } from './use-create-case-page-state'
import { useCreateCaseTeamSelection } from './use-create-case-team-selection'
import { useCreateCaseSubmission } from './use-create-case-submission'

export function useCreateCasePage() {
  const state = useCreateCasePageState()
  const lookups = useCreateCaseLookups(
    state.form,
    state.initialManager,
    state.setInitialManager,
    state.intakeSearch,
  )
  const selection = useCreateCaseTeamSelection({
    append: state.append,
    remove: state.remove,
    manager: state.initialManager,
    teamMembers: state.teamMemberDetails,
    setManager: state.setInitialManager,
    setManagerId: (id) =>
      state.form.setValue('initialManagerCollaboratorId', id, {
        shouldValidate: true,
      }),
    setTeamMembers: state.setTeamMemberDetails,
    setInitialManagerOpen: state.setIsManagerSelectorOpen,
    setTeamOpen: state.setIsTeamSelectorOpen,
  })
  const submission = useCreateCaseSubmission()

  async function onSubmit(data: CreateCaseData) {
    await submission.onSubmit(data, state.initialManager)
  }

  function handleOpenManagerSelector() {
    state.setIsManagerSelectorOpen(true)
  }
  function handleOpenTeamSelector() {
    state.setIsTeamSelectorOpen(true)
  }

  return {
    canCreateCase: Boolean(state.form.watch('intakeId') && state.initialManager),
    handleOpenManagerSelector,
    handleOpenTeamSelector,
    ...state,
    ...lookups,
    ...selection,
    isCreatingCase: submission.isCreatingCase,
    onSubmit,
  }
}
