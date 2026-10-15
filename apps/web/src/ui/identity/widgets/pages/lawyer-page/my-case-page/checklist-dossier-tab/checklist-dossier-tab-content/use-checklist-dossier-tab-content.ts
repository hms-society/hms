import type { ChecklistDossierTabProps } from '../checklist-dossier-tab-props'
import { useChecklistDossierTab } from '../use-checklist-dossier-tab'
import { useListCaseDocumentExceptionsQuery } from '@/ui/document-engine/hooks/use-list-case-document-exceptions-query'
import { useCurrentCollaboratorQuery } from '@/ui/identity/hooks/use-current-collaborator-query'
import { useApproveDocumentExceptionAction } from '@/ui/document-engine/hooks/use-approve-document-exception-action'
import { useRejectDocumentExceptionAction } from '@/ui/document-engine/hooks/use-reject-document-exception-action'
import { useReducer, useState } from 'react'

type RejectModalState = {
  exceptionToReject: string | null
  isRejectModalOpen: boolean
}
const INITIAL_REJECT_MODAL_STATE: RejectModalState = {
  exceptionToReject: null,
  isRejectModalOpen: false,
}

export function useChecklistDossierTabContent({
  caseId,
  caseDetails,
  checklist,
  isReviewDisabled,
  readOnly,
}: Pick<
  ChecklistDossierTabProps,
  'caseId' | 'caseDetails' | 'checklist' | 'isReviewDisabled' | 'readOnly'
>) {
  const state = useChecklistDossierTab({
    caseId,
    ...(caseDetails ? { caseDetails } : {}),
    checklist,
    isReviewDisabled: Boolean(isReviewDisabled || readOnly),
  })
  const exceptionsController = useCaseExceptionsController(caseId)
  const hasAuthorizedException =
    state.checklistGateLabel === 'Aprovado com exceção' &&
    exceptionsController.exceptions.some((exception) => exception.status === 'APPROVED')
  return { ...exceptionsController, state, hasAuthorizedException }
  function useCaseExceptionsController(caseId: string) {
    return {
      ...useExceptionAccessController(caseId),
      ...useExceptionReviewController(caseId),
    }
  }

  function useExceptionAccessController(caseId: string) {
    const exceptions = useListCaseDocumentExceptionsQuery(caseId).exceptions
    const canApprove =
      useCurrentCollaboratorQuery().currentCollaborator?.profile === 'supervisor'
    return { ...useApproveDocumentExceptionAction(caseId), canApprove, exceptions }
  }

  function useExceptionReviewController(caseId: string) {
    const { rejectException, isRejectingException } =
      useRejectDocumentExceptionAction(caseId)
    const reviewState = useExceptionReviewState(rejectException)
    return { isRejectingException, ...reviewState }
  }

  function useExceptionReviewState(
    rejectException: ReturnType<
      typeof useRejectDocumentExceptionAction
    >['rejectException'],
  ) {
    const rejectModal = useRejectModalState()
    const viewedJustification = useViewedJustificationState()

    function handleConfirmReject(justification: string) {
      return confirmExceptionRejection(rejectException, rejectModal, justification)
    }
    return { ...viewedJustification, ...rejectModal, handleConfirmReject }
  }

  async function confirmExceptionRejection(
    rejectException: ReturnType<
      typeof useRejectDocumentExceptionAction
    >['rejectException'],
    rejectModal: ReturnType<typeof useRejectModalState>,
    justification: string,
  ) {
    if (!rejectModal.exceptionToReject) return
    await rejectException({ exceptionId: rejectModal.exceptionToReject, justification })
    rejectModal.clearRejectedException()
  }

  function useRejectModalState() {
    const [state, update] = useReducer(rejectModalReducer, INITIAL_REJECT_MODAL_STATE)
    function clearRejectedException() {
      update({ exceptionToReject: null })
    }
    function closeRejectModal() {
      update({ isRejectModalOpen: false })
    }
    function handleOpenRejectModal(exceptionId: string) {
      update({ exceptionToReject: exceptionId, isRejectModalOpen: true })
    }
    return { ...state, clearRejectedException, closeRejectModal, handleOpenRejectModal }
  }

  function rejectModalReducer(state: RejectModalState, patch: Partial<RejectModalState>) {
    return { ...state, ...patch }
  }

  function useViewedJustificationState() {
    const [justificationToView, setJustificationToView] = useState<string | null>(null)

    function closeJustification() {
      setJustificationToView(null)
    }

    return { closeJustification, justificationToView, setJustificationToView }
  }
}
