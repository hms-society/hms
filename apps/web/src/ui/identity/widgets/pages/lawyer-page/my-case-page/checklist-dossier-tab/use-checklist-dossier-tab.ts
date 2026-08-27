import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'

import type { LegalCase } from '@hms/core/case-management/domain/entities'
import {
  CaseChecklistGateDecision,
  type CaseChecklistGateDecision as CaseChecklistGateDecisionValue,
  LegalCaseStatus,
} from '@hms/core/case-management/domain/structures'

import { useCurrentCollaboratorQuery } from '@/ui/identity/hooks/use-current-collaborator-query'
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
  const { currentCollaborator } = useCurrentCollaboratorQuery()
  const reviewerName =
    currentCollaborator?.professionalName?.trim() || 'Colaborador autenticado'
  const [actionFeedback, setActionFeedback] = useState<string | null>(null)
  const [checklistItems, setChecklistItems] = useState(checklist)
  const [complementaryItems, setComplementaryItems] = useState<string[]>([])
  const [remarks, setRemarks] = useState('')
  const [pendingDecision, setPendingDecision] =
    useState<CaseChecklistGateDecisionValue | null>(null)
  const [reasonError, setReasonError] = useState<string | null>(null)
  const [reviewedCase, setReviewedCase] = useState<LegalCase | null>(null)
  const validatedItemsCount = checklistItems.filter(
    (item) => item.status === 'validado',
  ).length
  const mandatoryItemsCount = checklistItems.length
  const pendingItemsCount = mandatoryItemsCount - validatedItemsCount
  const isChecklistComplete = pendingItemsCount === 0
  const checklistGateDecision = reviewedCase?.checklistGate.decision
  const checklistGateRemarks = reviewedCase?.checklistGate.remarks
  const checklistGateAuditLabel =
    reviewedCase?.checklistGate.decidedAt && reviewedCase.checklistGate.decidedBy
      ? `Decisão registrada por ${getChecklistGateReviewerName(
          reviewedCase.checklistGate.decidedBy,
          currentCollaborator,
        )} em ${formatChecklistGateDecisionDate(reviewedCase.checklistGate.decidedAt)}`
      : undefined
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

  function handleValidateChecklistItem(itemId: string) {
    const validatedAt = formatChecklistValidationTime(new Date())

    setChecklistItems((currentItems) =>
      currentItems.map((item) => {
        if (item.id !== itemId || item.status === 'validado') return item

        return {
          ...item,
          documentName: `${item.title} - validado por ${reviewerName} ${validatedAt}`,
          pendencies: undefined,
          status: 'validado',
        }
      }),
    )
    setActionFeedback('Documento validado e registrado na trilha do checklist.')
  }

  function handleOpenValidationDesk() {
    setActionFeedback('Mesa de Validação aberta para revisar os documentos deste caso.')
  }

  function handleFilterByCase() {
    setActionFeedback('Filtro do caso aplicado ao checklist documental.')
  }

  function handleAddComplementaryItem() {
    setComplementaryItems((currentItems) => [
      ...currentItems,
      `Item complementar ${currentItems.length + 1} - adicionado por ${reviewerName}`,
    ])
    setActionFeedback('Item complementar adicionado ao checklist deste caso.')
  }

  function handleRequestDocumentException() {
    setActionFeedback(
      'Solicitação de exceção documental registrada para análise de perfil autorizado.',
    )
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
    actionFeedback,
    canStartLegalWriting,
    checklistGateAuditLabel,
    checklistGateLabel,
    checklistGateRemarks,
    checklistItems,
    complementaryItems,
    decisionReasonDialog,
    dossierGateLabel,
    error: mutation.error,
    handleApproveChecklist,
    handleApproveWithException,
    handleBlockChecklist,
    handleCancelDecisionReason,
    handleConfirmDecisionReason,
    handleDecisionReasonDialogOpenChange,
    handleAddComplementaryItem,
    handleFilterByCase,
    handleOpenValidationDesk,
    handleRejectOnMerit,
    handleRemarksChange,
    handleRequestDocumentException,
    handleValidateChecklistItem,
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

function getChecklistGateReviewerName(
  decidedBy: string,
  currentCollaborator: {
    collaboratorId: string
    professionalName?: string | null
  } | null,
) {
  if (currentCollaborator?.collaboratorId === decidedBy) {
    return currentCollaborator.professionalName?.trim() || decidedBy
  }

  return decidedBy
}

function formatChecklistGateDecisionDate(value: Date | string) {
  const date = new Date(value)
  const day = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
  }).format(date)
  const time = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(date)

  return `${day} ${time}`
}

function formatChecklistValidationTime(date: Date) {
  const time = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(date)

  return `hoje ${time}`
}
