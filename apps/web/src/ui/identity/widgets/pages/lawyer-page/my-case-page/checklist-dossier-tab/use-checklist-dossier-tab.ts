import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type {
  LegalCase,
  LegalCaseSummary,
} from '@hms/core/case-management/domain/entities'
import {
  CaseChecklistGateDecision,
  type CaseChecklistGateDecision as CaseChecklistGateDecisionValue,
  LegalCaseStatus,
} from '@hms/core/case-management/domain/structures'

import { useCurrentCollaboratorQuery } from '@/ui/identity/hooks/use-current-collaborator-query'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'
import { useCaseChecklist } from '../hooks/use-case-checklist'
import { useRequestDocumentExceptionAction } from '@/ui/document-engine/hooks/use-request-document-exception-action'
import type { ChecklistItem } from '../types'

export type UseChecklistDossierTabParams = {
  caseId: string
  caseDetails?: LegalCaseSummary
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
  caseDetails,
  checklist,
  isReviewDisabled = false,
}: UseChecklistDossierTabParams) {
  const { caseManagementService } = useRestContext()
  const { navigateTo } = useNavigation()
  const queryClient = useQueryClient()
  const { currentCollaborator } = useCurrentCollaboratorQuery()
  const pendingsQuery = useQuery({
    queryKey: ['case-management', 'cases', caseId, 'pendencies'],
    queryFn: async () => {
      const response = await caseManagementService.listCasePendings(caseId)
      if (response.isFailure) response.throwError()
      return response.body
    },
  })
  const pendingCountByChecklistItemId = new Map<string, number>()
  for (const pending of pendingsQuery.data ?? []) {
    pendingCountByChecklistItemId.set(
      pending.checklistItemId,
      (pendingCountByChecklistItemId.get(pending.checklistItemId) ?? 0) + 1,
    )
  }
  const reviewerName =
    currentCollaborator?.professionalName?.trim() || 'Colaborador autenticado'
  const [actionFeedback, setActionFeedback] = useState<string | null>(null)
  const [checklistItems, setChecklistItems] = useState(checklist)
  const [complementaryItems, setComplementaryItems] = useState<string[]>([])
  const [remarks, setRemarks] = useState('')
  const [isExceptionModalOpen, setIsExceptionModalOpen] = useState(false)

  const { requestException, isRequestingException } =
    useRequestDocumentExceptionAction(caseId)
  const [pendingDecision, setPendingDecision] =
    useState<CaseChecklistGateDecisionValue | null>(null)
  const [reasonError, setReasonError] = useState<string | null>(null)
  const [reviewedCase, setReviewedCase] = useState<LegalCase | null>(null)
  const {
    checklistItems: displayChecklistItems,
    isChecklistComplete,
    mandatoryItemsCount,
    pendingItemsCount,
    persistedChecklistItems,
    validatedItemsCount,
  } = useCaseChecklist({ caseId, fallbackChecklist: checklistItems })
  const persistedCase = reviewedCase ?? caseDetails
  const checklistGateDecision = persistedCase?.checklistGate.decision
  const checklistGateRemarks = persistedCase?.checklistGate.remarks
  const checklistGateAuditLabel =
    persistedCase?.checklistGate.decidedAt && persistedCase.checklistGate.decidedBy
      ? `Decisão registrada por ${getChecklistGateReviewerName(
          persistedCase.checklistGate.decidedBy,
          currentCollaborator,
        )} em ${formatChecklistGateDecisionDate(persistedCase.checklistGate.decidedAt)}`
      : undefined
  const checklistGateLabel = checklistGateDecision
    ? CHECKLIST_GATE_LABELS[checklistGateDecision]
    : 'Checklist pendente'
  const dossierGateLabel = persistedCase?.dossierGate.homologatedAt
    ? 'Dossiê homologado'
    : 'Dossiê pendente'
  const canStartLegalWriting = Boolean(
    persistedCase?.checklistGate.decision &&
      persistedCase.dossierGate.homologatedAt &&
      persistedCase.status === LegalCaseStatus.LegalProduction,
  )
  const hasChecklistDecision = Boolean(checklistGateDecision)
  const canHomologateDossier = Boolean(
    !persistedCase?.dossierGate.homologatedAt &&
      (checklistGateDecision === CaseChecklistGateDecision.Approved ||
        checklistGateDecision === CaseChecklistGateDecision.ApprovedWithException) &&
      persistedCase?.status === LegalCaseStatus.ReadyForLegalProduction &&
      isChecklistComplete,
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
    onSuccess: async (legalCase) => {
      setReviewedCase(legalCase)
      setPendingDecision(null)
      setRemarks('')
      setReasonError(null)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['case-details', caseId] }),
        queryClient.invalidateQueries({ queryKey: ['case-management', 'my-cases'] }),
      ])
    },
  })

  const homologationMutation = useMutation({
    mutationFn: async () => {
      const response = await caseManagementService.homologateDossier(caseId)
      if (response.isFailure) response.throwError()
      return response.body
    },
    onSuccess: async (legalCase) => {
      setReviewedCase(legalCase)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['case-details', caseId] }),
        queryClient.invalidateQueries({ queryKey: ['case-management', 'my-cases'] }),
      ])
    },
  })

  const addComplementaryItemMutation = useMutation({
    mutationFn: async () => {
      const itemNumber = complementaryItems.length + 1
      const response = await caseManagementService.addComplementaryChecklistItem(caseId, {
        templateItemKey: `complementary-item-${itemNumber}`,
        title: `Item complementar ${itemNumber}`,
      })

      if (response.isFailure) response.throwError()

      return response.body
    },
    onSuccess: async (item) => {
      setComplementaryItems((currentItems) => [
        ...currentItems,
        `${item.title} - adicionado por ${reviewerName}`,
      ])
      await queryClient.invalidateQueries({
        queryKey: ['case-management', 'cases', caseId, 'checklist'],
      })
      setActionFeedback('Item complementar adicionado ao checklist deste caso.')
    },
  })

  function handleRemarksChange(value: string) {
    setRemarks(value)
    if (reasonError) setReasonError(null)
  }

  function handleValidateChecklistItem(itemId: string) {
    const checklistItem = displayChecklistItems.find((item) => item.id === itemId)

    if (checklistItem?.documentFileId) {
      return navigateTo('documentAnalysis', {
        params: { fileId: checklistItem.documentFileId },
        search: { fromCaseId: caseId },
      })
    }

    if (persistedChecklistItems.length > 0) {
      return navigateTo('lawyerCaseChecklistItem', {
        params: { caseId, checklistItemId: itemId },
      })
    }

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

  function handleOpenChecklistItemDetail(itemId: string) {
    return navigateTo('lawyerCaseChecklistItem', {
      params: { caseId, checklistItemId: itemId },
    })
  }

  function handleOpenValidationDesk() {
    return navigateTo('documentInbox')
  }

  function handleFilterByCase() {
    return navigateTo('documentInbox', { search: { caseId } })
  }

  function handleAddComplementaryItem() {
    return addComplementaryItemMutation.mutateAsync()
  }

  function handleRequestDocumentException() {
    setIsExceptionModalOpen(true)
  }

  function handleApproveChecklist() {
    return mutation.mutateAsync(CaseChecklistGateDecision.Approved)
  }

  function handleHomologateDossier() {
    return homologationMutation.mutateAsync()
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
    canHomologateDossier,
    checklistGateAuditLabel,
    checklistGateLabel,
    checklistGateRemarks,
    checklistItems: displayChecklistItems,
    pendingCountByChecklistItemId,
    pendings: pendingsQuery.data ?? [],
    complementaryItems,
    decisionReasonDialog,
    dossierGateLabel,
    error: homologationMutation.error ?? mutation.error,
    handleApproveChecklist,
    handleHomologateDossier,
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
    handleOpenChecklistItemDetail,
    handleValidateChecklistItem,
    isDecisionReasonDialogOpen,
    isChecklistComplete,
    isExceptionModalOpen,
    isRequestingException,
    isReviewDisabled,
    hasChecklistDecision,
    isHomologatingDossier: homologationMutation.isPending,
    isReviewingChecklistGate:
      mutation.isPending || addComplementaryItemMutation.isPending,
    mandatoryItemsCount,
    pendingItemsCount,
    reasonError,
    remarks,
    requestException,
    setIsExceptionModalOpen,
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
