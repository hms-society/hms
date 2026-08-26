import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'

import type { LegalCase } from '@hms/core/case-management/domain/entities'
import {
  CaseChecklistGateDecision,
  type CaseChecklistGateDecision as CaseChecklistGateDecisionValue,
  LegalCaseStatus,
} from '@hms/core/case-management/domain/structures'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import type { ChecklistItem } from '../types'

export type UseChecklistDossierTabParams = {
  caseId: string
  checklist: ChecklistItem[]
  isReviewDisabled?: boolean
}

const CHECKLIST_GATE_LABELS: Record<CaseChecklistGateDecisionValue, string> = {
  [CaseChecklistGateDecision.Approved]: 'Aprovado',
  [CaseChecklistGateDecision.ApprovedWithException]: 'Aprovado com exceção',
  [CaseChecklistGateDecision.BlockedInsufficient]: 'Bloqueado/insuficiente',
  [CaseChecklistGateDecision.RejectedOnMerit]: 'Reprovado por mérito jurídico',
}

const REASON_REQUIRED_DECISIONS = new Set<CaseChecklistGateDecisionValue>([
  CaseChecklistGateDecision.ApprovedWithException,
  CaseChecklistGateDecision.BlockedInsufficient,
  CaseChecklistGateDecision.RejectedOnMerit,
])

const DECISION_DIALOG_COPY: Record<
  CaseChecklistGateDecisionValue,
  { confirmLabel: string; description: string; title: string }
> = {
  [CaseChecklistGateDecision.Approved]: {
    confirmLabel: 'Confirmar aprovação',
    description:
      'Ao confirmar, o checklist será aprovado e o caso seguirá para o próximo gate documental.',
    title: 'Deseja aprovar este checklist?',
  },
  [CaseChecklistGateDecision.ApprovedWithException]: {
    confirmLabel: 'Confirmar exceção',
    description:
      'Ao confirmar, o checklist avançará com ressalvas registradas para auditoria e acompanhamento do dossiê documental.',
    title: 'Deseja aprovar com exceção?',
  },
  [CaseChecklistGateDecision.BlockedInsufficient]: {
    confirmLabel: 'Confirmar bloqueio',
    description:
      'Ao confirmar, o caso permanecerá bloqueado para produção jurídica até que as pendências sejam resolvidas.',
    title: 'Deseja bloquear este checklist?',
  },
  [CaseChecklistGateDecision.RejectedOnMerit]: {
    confirmLabel: 'Confirmar reprovação',
    description:
      'Ao confirmar, o avanço será impedido por insuficiência de mérito jurídico, mesmo que a documentação esteja formalmente completa.',
    title: 'Deseja reprovar por mérito?',
  },
}

export function useChecklistDossierTab({
  caseId,
  checklist,
  isReviewDisabled = false,
}: UseChecklistDossierTabParams) {
  const { caseManagementService } = useRestContext()
  const [remarks, setRemarks] = useState('')
  const [pendingDecision, setPendingDecision] =
    useState<CaseChecklistGateDecisionValue | null>(null)
  const [reasonError, setReasonError] = useState<string | null>(null)
  const [reviewedCase, setReviewedCase] = useState<LegalCase | null>(null)
  const validatedItemsCount = checklist.filter(
    (item) => item.status === 'validado',
  ).length
  const mandatoryItemsCount = checklist.length
  const pendingItemsCount = mandatoryItemsCount - validatedItemsCount
  const isChecklistComplete = pendingItemsCount === 0
  const checklistGateDecision = reviewedCase?.checklistGate.decision
  const checklistGateRemarks = reviewedCase?.checklistGate.remarks
  const checklistGateLabel = checklistGateDecision
    ? CHECKLIST_GATE_LABELS[checklistGateDecision]
    : 'Checklist pendente'
  const dossierGateLabel = reviewedCase?.dossierGate.homologatedAt
    ? 'Dossiê homologado'
    : 'Dossiê pendente'
  const canStartLegalWriting = Boolean(
    reviewedCase?.checklistGate.decision &&
      reviewedCase.dossierGate.homologatedAt &&
      reviewedCase.status === LegalCaseStatus.LegalProduction,
  )
  const decisionReasonDialog = pendingDecision
    ? DECISION_DIALOG_COPY[pendingDecision]
    : DECISION_DIALOG_COPY[CaseChecklistGateDecision.ApprovedWithException]
  const isDecisionReasonDialogOpen = Boolean(pendingDecision)

  const mutation = useMutation({
    mutationFn: async (decision: CaseChecklistGateDecisionValue) => {
      if (isReviewDisabled) {
        throw new Error('A revisão deste checklist ainda não está disponível.')
      }

      const response = await caseManagementService.reviewChecklistGate(caseId, {
        decision,
        remarks: remarks.trim() || undefined,
      })

      if (response.isFailure) response.throwError()

      return response.body
    },
    onSuccess: (legalCase) => {
      setReviewedCase(legalCase)
      setPendingDecision(null)
      setRemarks('')
      setReasonError(null)
    },
  })

  function handleRemarksChange(value: string) {
    setRemarks(value)
    if (reasonError) setReasonError(null)
  }

  function handleApproveChecklist() {
    return mutation.mutateAsync(CaseChecklistGateDecision.Approved)
  }

  function handleApproveWithException() {
    openDecisionReasonDialog(CaseChecklistGateDecision.ApprovedWithException)
  }

  function handleBlockChecklist() {
    openDecisionReasonDialog(CaseChecklistGateDecision.BlockedInsufficient)
  }

  function handleRejectOnMerit() {
    openDecisionReasonDialog(CaseChecklistGateDecision.RejectedOnMerit)
  }

  function handleDecisionReasonDialogOpenChange(open: boolean) {
    if (open) return

    closeDecisionReasonDialog()
  }

  function handleCancelDecisionReason() {
    closeDecisionReasonDialog()
  }

  function handleConfirmDecisionReason() {
    if (!pendingDecision) return Promise.resolve()

    if (REASON_REQUIRED_DECISIONS.has(pendingDecision) && !remarks.trim()) {
      setReasonError('Informe o motivo da decisão.')
      return Promise.resolve()
    }

    return mutation.mutateAsync(pendingDecision)
  }

  function openDecisionReasonDialog(decision: CaseChecklistGateDecisionValue) {
    setPendingDecision(decision)
    setRemarks('')
    setReasonError(null)
  }

  function closeDecisionReasonDialog() {
    if (mutation.isPending) return

    setPendingDecision(null)
    setRemarks('')
    setReasonError(null)
  }

  return {
    canStartLegalWriting,
    checklistGateLabel,
    checklistGateRemarks,
    decisionReasonDialog,
    dossierGateLabel,
    error: mutation.error,
    handleApproveChecklist,
    handleApproveWithException,
    handleBlockChecklist,
    handleCancelDecisionReason,
    handleConfirmDecisionReason,
    handleDecisionReasonDialogOpenChange,
    handleRejectOnMerit,
    handleRemarksChange,
    isDecisionReasonDialogOpen,
    isChecklistComplete,
    isReviewDisabled,
    isReviewingChecklistGate: mutation.isPending,
    mandatoryItemsCount,
    pendingItemsCount,
    reasonError,
    remarks,
    validatedItemsCount,
  }
}
