import {
  CaseMemberRole,
  LegalCaseStatus,
} from '@hms/core/case-management/domain/structures'
import type {
  CaseEligibleCollaborator,
  CaseTeam,
  CaseTeamMember,
} from '@hms/core/case-management/domain/structures'
import { ConflictError } from '@hms/core/shared/domain/errors'

import { useAddCaseTeamMemberAction } from '@/ui/case-management/hooks/use-add-case-team-member-action'
import { useChangeCaseTeamMemberRoleAction } from '@/ui/case-management/hooks/use-change-case-team-member-role-action'
import { useRemoveCaseTeamMemberAction } from '@/ui/case-management/hooks/use-remove-case-team-member-action'
import type { PendingMutation } from './case-team-mutation-types'
import { useCaseTeamMutationState } from './use-case-team-mutation-state'

export type { PendingMutation } from './case-team-mutation-types'

type MutationSubmissionDependencies = {
  state: ReturnType<typeof useCaseTeamMutationState>
  actions: ReturnType<typeof useTeamMutationActions>
  caseTeam?: CaseTeam
  refetchCaseTeam: () => Promise<unknown>
}

function createMutationRequest(dependencies: MutationSubmissionDependencies) {
  return function getMutationRequest() {
    const { caseTeam, state } = dependencies
    const { pendingMutation } = state
    if (!caseTeam || !pendingMutation) return null
    const request = getMutationBaseRequest(dependencies, caseTeam, pendingMutation)
    return submitMutationRequest(dependencies, pendingMutation, request)
  }
}

function getMutationBaseRequest(
  dependencies: MutationSubmissionDependencies,
  caseTeam: CaseTeam,
  pendingMutation: PendingMutation,
) {
  const operationId = getOperationId(dependencies)
  const reason = getMutationReason(dependencies, caseTeam, pendingMutation)
  return {
    expectedTeamVersion: caseTeam.teamVersion,
    operationId,
    ...(reason ? { reason } : {}),
  }
}

function getOperationId(dependencies: MutationSubmissionDependencies) {
  if (dependencies.state.operationId) return dependencies.state.operationId
  const operationId = crypto.randomUUID()
  dependencies.state.setOperationId(operationId)
  return operationId
}

function getMutationReason(
  dependencies: MutationSubmissionDependencies,
  caseTeam: CaseTeam,
  pendingMutation: PendingMutation,
) {
  if (!caseTeam.requiresAdministrativeReason || pendingMutation.kind === 'add') return
  return dependencies.state.reason.trim() || undefined
}

function submitAddMutation(
  dependencies: MutationSubmissionDependencies,
  pendingMutation: Extract<PendingMutation, { kind: 'add' }>,
  request: ReturnType<typeof getMutationBaseRequest>,
) {
  return dependencies.actions.addCaseTeamMember({
    ...request,
    collaboratorId: pendingMutation.candidate.collaboratorId,
    role: pendingMutation.role,
  })
}

function submitRoleMutation(
  dependencies: MutationSubmissionDependencies,
  pendingMutation: Extract<PendingMutation, { kind: 'role' }>,
  request: ReturnType<typeof getMutationBaseRequest>,
) {
  return dependencies.actions.changeCaseTeamMemberRole({
    membershipId: pendingMutation.member.membershipId,
    request: { ...request, role: pendingMutation.role },
  })
}

function submitRemovalMutation(
  dependencies: MutationSubmissionDependencies,
  pendingMutation: Extract<PendingMutation, { kind: 'remove' }>,
  request: ReturnType<typeof getMutationBaseRequest>,
) {
  return dependencies.actions.removeCaseTeamMember({
    membershipId: pendingMutation.member.membershipId,
    request,
  })
}

function submitMutationRequest(
  dependencies: MutationSubmissionDependencies,
  pendingMutation: PendingMutation,
  request: ReturnType<typeof getMutationBaseRequest>,
) {
  if (pendingMutation.kind === 'add')
    return submitAddMutation(dependencies, pendingMutation, request)
  if (pendingMutation.kind === 'role')
    return submitRoleMutation(dependencies, pendingMutation, request)
  return submitRemovalMutation(dependencies, pendingMutation, request)
}

type ConfirmHandlerDependencies = MutationSubmissionDependencies & {
  submit: () => Promise<unknown> | null
}

function getValidationError(dependencies: ConfirmHandlerDependencies) {
  return isRemovalReasonRequired(dependencies)
    ? 'Informe uma justificativa administrativa.'
    : null
}

function isRemovalReasonRequired(dependencies: ConfirmHandlerDependencies) {
  return Boolean(
    dependencies.caseTeam?.requiresAdministrativeReason &&
      dependencies.state.pendingMutation?.kind === 'remove' &&
      !dependencies.state.reason.trim(),
  )
}

function getMutationErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Não foi possível concluir a alteração. Tente novamente.'
}

async function handleMutationConflict(dependencies: ConfirmHandlerDependencies) {
  dependencies.state.setHasVersionConflict(true)
  dependencies.state.setOperationId(null)
  await dependencies.refetchCaseTeam()
  dependencies.state.setMutationError(
    'A equipe foi atualizada. Revise os dados e confirme novamente.',
  )
}

function canConfirmMutation(dependencies: ConfirmHandlerDependencies) {
  return Boolean(
    dependencies.caseTeam &&
      dependencies.state.pendingMutation &&
      !dependencies.actions.isMutationPending,
  )
}

async function handleMutationFailure(
  dependencies: ConfirmHandlerDependencies,
  error: unknown,
) {
  if (error instanceof ConflictError) {
    await handleMutationConflict(dependencies)
    return
  }
  dependencies.state.setMutationError(getMutationErrorMessage(error))
}

async function submitConfirmedMutation(dependencies: ConfirmHandlerDependencies) {
  try {
    await dependencies.submit()
    dependencies.state.resetMutationState()
  } catch (error) {
    await handleMutationFailure(dependencies, error)
  }
}

async function handleConfirmMutation(dependencies: ConfirmHandlerDependencies) {
  if (!canConfirmMutation(dependencies)) return
  const validationError = getValidationError(dependencies)
  if (setValidationError(dependencies, validationError)) return
  dependencies.state.setMutationError(null)
  await submitConfirmedMutation(dependencies)
}

function setValidationError(
  dependencies: ConfirmHandlerDependencies,
  validationError: string | null,
) {
  if (!validationError) return false
  dependencies.state.setMutationError(validationError)
  return true
}

function createConfirmHandler(dependencies: ConfirmHandlerDependencies) {
  return function confirmMutation() {
    return handleConfirmMutation(dependencies)
  }
}

function useTeamMutationActions(caseId: string) {
  const addAction = useAddCaseTeamMemberAction(caseId)
  const changeRoleAction = useChangeCaseTeamMemberRoleAction(caseId)
  const removeAction = useRemoveCaseTeamMemberAction(caseId)
  return createTeamMutationActionResult(addAction, changeRoleAction, removeAction)
}

function createTeamMutationActionResult(
  addAction: ReturnType<typeof useAddCaseTeamMemberAction>,
  changeRoleAction: ReturnType<typeof useChangeCaseTeamMemberRoleAction>,
  removeAction: ReturnType<typeof useRemoveCaseTeamMemberAction>,
) {
  return {
    addCaseTeamMember: addAction.addCaseTeamMember,
    changeCaseTeamMemberRole: changeRoleAction.changeCaseTeamMemberRole,
    removeCaseTeamMember: removeAction.removeCaseTeamMember,
    isMutationPending: hasPendingTeamMutation(addAction, changeRoleAction, removeAction),
  }
}

function hasPendingTeamMutation(
  addAction: ReturnType<typeof useAddCaseTeamMemberAction>,
  changeRoleAction: ReturnType<typeof useChangeCaseTeamMemberRoleAction>,
  removeAction: ReturnType<typeof useRemoveCaseTeamMemberAction>,
) {
  return Boolean(
    addAction.isAddingCaseTeamMember ||
      changeRoleAction.isChangingCaseTeamMemberRole ||
      removeAction.isRemovingCaseTeamMember,
  )
}

function canChangeMember(caseTeam: CaseTeam | undefined, member: CaseTeamMember) {
  return Boolean(
    caseTeam?.canManage &&
      caseTeam.status !== LegalCaseStatus.Closed &&
      member.isEligible &&
      !(member.role === CaseMemberRole.Manager && caseTeam.activeManagerCount === 1),
  )
}

function handleBeginRoleChange(
  state: ReturnType<typeof useCaseTeamMutationState>,
  caseTeam: CaseTeam | undefined,
  member: CaseTeamMember,
) {
  if (!canChangeMember(caseTeam, member)) return
  const role =
    member.role === CaseMemberRole.Manager
      ? CaseMemberRole.Collaborator
      : CaseMemberRole.Manager
  state.beginMutation({ kind: 'role', member, role })
}

function handleBeginRemoval(
  state: ReturnType<typeof useCaseTeamMutationState>,
  caseTeam: CaseTeam | undefined,
  member: CaseTeamMember,
) {
  if (canChangeMember(caseTeam, member)) state.beginMutation({ kind: 'remove', member })
}

function createMemberMutationHandlers(
  state: ReturnType<typeof useCaseTeamMutationState>,
  caseTeam: CaseTeam | undefined,
) {
  return {
    handleBeginRoleChange: (member: CaseTeamMember) =>
      handleBeginRoleChange(state, caseTeam, member),
    handleBeginRemoval: (member: CaseTeamMember) =>
      handleBeginRemoval(state, caseTeam, member),
  }
}

function createCandidateSelectionHandler(
  state: ReturnType<typeof useCaseTeamMutationState>,
) {
  return function handleSelectCandidate(
    candidate: CaseEligibleCollaborator,
    role: CaseMemberRole,
  ) {
    state.beginMutation({ kind: 'add', candidate, role })
    state.setIsSelectorOpen(false)
  }
}

function createSelectorDialogHandlers(
  state: ReturnType<typeof useCaseTeamMutationState>,
  isMutationPending: boolean,
) {
  return {
    handlePendingMutationOpenChange: (open: boolean) => {
      if (!open && !isMutationPending) state.resetMutationState()
    },
    handleOpenSelector: () => {
      state.setMutationError(null)
      state.setIsSelectorOpen(true)
    },
    handleCloseSelector: () => !isMutationPending && state.setIsSelectorOpen(false),
  }
}

function createSelectorMutationHandlers(
  state: ReturnType<typeof useCaseTeamMutationState>,
  isMutationPending: boolean,
) {
  return {
    handleSelectCandidate: createCandidateSelectionHandler(state),
    ...createSelectorDialogHandlers(state, isMutationPending),
  }
}

type MutationHandlerDependencies = Pick<
  MutationSubmissionDependencies,
  'state' | 'actions' | 'caseTeam'
>

function createMutationHandlers(params: MutationHandlerDependencies) {
  return {
    ...createMemberMutationHandlers(params.state, params.caseTeam),
    ...createSelectorMutationHandlers(params.state, params.actions.isMutationPending),
  }
}

function createMutationSubmission(params: MutationSubmissionDependencies) {
  const submit = createMutationRequest(params)
  const handleConfirmMutation = createConfirmHandler({ ...params, submit })

  return { handleConfirmMutation }
}

function createMutationDialogState(state: ReturnType<typeof useCaseTeamMutationState>) {
  return {
    hasVersionConflict: state.hasVersionConflict,
    isSelectorOpen: state.isSelectorOpen,
    mutationError: state.mutationError,
    reason: state.reason,
  }
}

function createMutationCaseState(
  state: ReturnType<typeof useCaseTeamMutationState>,
  actions: ReturnType<typeof useTeamMutationActions>,
) {
  return {
    isMutationPending: actions.isMutationPending,
    pendingMutation: state.pendingMutation,
  }
}

function createMutationViewState(
  state: ReturnType<typeof useCaseTeamMutationState>,
  actions: ReturnType<typeof useTeamMutationActions>,
) {
  return {
    ...createMutationDialogState(state),
    ...createMutationCaseState(state, actions),
  }
}

function createMutationResult(params: {
  state: ReturnType<typeof useCaseTeamMutationState>
  actions: ReturnType<typeof useTeamMutationActions>
  handlers: ReturnType<typeof createMutationHandlers>
  submission: ReturnType<typeof createMutationSubmission>
}) {
  const { state, actions, handlers, submission } = params
  return {
    ...createMutationViewState(state, actions),
    ...handlers,
    ...submission,
    handleReasonChange: state.setReason,
  }
}

function createMutationResultParts(
  state: ReturnType<typeof useCaseTeamMutationState>,
  actions: ReturnType<typeof useTeamMutationActions>,
  caseTeam: CaseTeam | undefined,
  refetchCaseTeam: () => Promise<unknown>,
) {
  return {
    handlers: createMutationHandlers({
      state,
      actions,
      caseTeam,
    }),
    submission: createMutationSubmission({ state, actions, caseTeam, refetchCaseTeam }),
  }
}

export function useCaseTeamMutation(
  caseId: string,
  caseTeam: CaseTeam | undefined,
  refetchCaseTeam: () => Promise<unknown>,
) {
  const state = useCaseTeamMutationState()
  const actions = useTeamMutationActions(caseId)
  const resultParts = createMutationResultParts(state, actions, caseTeam, refetchCaseTeam)
  return createMutationResult({ state, actions, ...resultParts })
}
