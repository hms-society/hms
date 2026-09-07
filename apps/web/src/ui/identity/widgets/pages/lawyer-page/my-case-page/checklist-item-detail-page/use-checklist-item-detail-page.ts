import { useQuery } from '@tanstack/react-query'

import type { CaseChecklistItem } from '@hms/core/case-management/domain/entities'
import type {
  DocumentValidationDocument,
  DocumentValidationLog,
} from '@hms/core/document-engine/domain/entities'
import { DocumentValidationStatus } from '@hms/core/document-engine/domain/structures'

import { useDocumentValidationDocumentQuery } from '@/ui/document-engine/hooks/use-document-validation-document-query'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { getChecklistDocumentStatusView } from '../checklist-document-status'
import {
  getChecklistItemHistoryEvents,
  type ChecklistItemHistoryEvent,
} from './checklist-item-history-events'

export type { ChecklistItemHistoryEvent } from './checklist-item-history-events'

export type UseChecklistItemDetailPageParams = {
  caseId: string
  checklistItemId: string
}

export type ChecklistItemDetailView = {
  auditMetrics: ChecklistItemMetric[]
  caseLabel: string
  documentLabel: string
  extractedFields: ChecklistItemField[]
  hasDocument: boolean
  historyEvents: ChecklistItemHistoryEvent[]
  itemPositionLabel: string
  pendingItems: ChecklistItemPending[]
  statusLabel: string
  statusVariant: 'attention' | 'secondary' | 'success'
}

export type ChecklistItemField = {
  label: string
  value: string
}

export type ChecklistItemMetric = {
  label: string
  value: string
}

export type ChecklistItemPending = {
  description: string
  id: string
  title: string
}

export function useChecklistItemDetailPage({
  caseId,
  checklistItemId,
}: UseChecklistItemDetailPageParams) {
  const { caseManagementService, documentValidationService } = useRestContext()
  const { navigateTo } = useNavigation()
  const {
    data: checklistItems = [],
    error: checklistError,
    isLoading: isLoadingChecklist,
  } = useQuery({
    queryKey: ['case-management', 'cases', caseId, 'checklist'],
    queryFn: async () => {
      const response = await caseManagementService.listCaseChecklist(caseId)

      if (response.isFailure) response.throwError()

      return response.body
    },
    enabled: Boolean(caseId),
  })
  const checklistItem = checklistItems.find((item) => item.id === checklistItemId)
  const documentFileId = checklistItem?.documentFileId ?? ''
  const { document, documentError, isLoadingDocument } =
    useDocumentValidationDocumentQuery(documentFileId)
  const {
    data: documentLogs = [],
    error: documentLogsError,
    isLoading: isLoadingDocumentLogs,
  } = useQuery({
    queryKey: ['document-validation', 'documents', documentFileId, 'logs'],
    queryFn: async () => {
      const response = await documentValidationService.listLogs(documentFileId)

      if (response.isFailure) response.throwError()

      return response.body
    },
    enabled: Boolean(documentFileId),
  })
  const itemView = getChecklistItemDetailView({
    caseId,
    checklistItem,
    document,
    documentLogs,
    itemIndex: checklistItem
      ? checklistItems.findIndex((item) => item.id === checklistItem.id)
      : -1,
    totalItemsCount: checklistItems.length,
  })
  const isLoading =
    isLoadingChecklist ||
    Boolean(documentFileId && (isLoadingDocument || isLoadingDocumentLogs))
  const error = checklistError ?? documentError ?? documentLogsError

  function handleBackToCase() {
    void navigateTo('lawyerCaseDetails', { params: { caseId } })
  }

  function handleOpenValidationDesk() {
    if (!documentFileId) return

    void navigateTo('documentAnalysis', {
      params: { fileId: documentFileId },
      search: { fromCaseId: caseId },
    })
  }

  return {
    checklistItem,
    document,
    documentFileId,
    error,
    isLoading,
    itemView,
    handleBackToCase,
    handleOpenValidationDesk,
  }
}

function getChecklistItemDetailView({
  caseId,
  checklistItem,
  document,
  documentLogs,
  itemIndex,
  totalItemsCount,
}: {
  caseId: string
  checklistItem?: CaseChecklistItem
  document?: DocumentValidationDocument
  documentLogs: DocumentValidationLog[]
  itemIndex: number
  totalItemsCount: number
}): ChecklistItemDetailView {
  if (!checklistItem) return getEmptyChecklistItemDetailView(caseId)

  const hasDocument = Boolean(checklistItem.documentFileId)
  const isValidated = checklistItem.status === 'validated'
  const documentLabel =
    checklistItem.documentFileName ?? document?.fileName ?? 'Nenhum documento vinculado'
  const documentStatusView = getChecklistDocumentStatusView({
    document,
    hasDocument,
    isValidated,
  })
  const statusLabel = documentStatusView.label
  const pendingItems = getPendingItems({ checklistItem, document })
  const extractedFields =
    document?.extractedFields.map((field) => ({
      label: field.label,
      value: field.value || 'Não identificado',
    })) ?? []
  const reviewedBy = getReviewerDisplayName({
    fallbackReviewerId: checklistItem.validatedBy ?? document?.reviewedBy,
    reviewerName: document?.reviewedByName,
  })
  const reviewedAt = checklistItem.validatedAt ?? document?.reviewedAt ?? undefined
  const historyEvents = getChecklistItemHistoryEvents({
    checklistItem,
    document,
    documentLogs,
    reviewedAt,
    reviewedBy,
    statusLabel,
  })

  return {
    auditMetrics: [
      { label: 'Eventos', value: String(historyEvents.length) },
      { label: 'Documento', value: hasDocument ? '1' : '0' },
      { label: 'Pendências', value: String(pendingItems.length) },
    ],
    caseLabel: document?.checklistLink?.caseLabel ?? `Caso ${caseId.slice(0, 8)}`,
    documentLabel,
    extractedFields,
    hasDocument,
    historyEvents,
    itemPositionLabel:
      itemIndex >= 0
        ? `${itemIndex + 1} de ${Math.max(totalItemsCount, itemIndex + 1)}`
        : 'Não informado',
    pendingItems,
    statusLabel,
    statusVariant: documentStatusView.variant,
  }
}

function getEmptyChecklistItemDetailView(caseId: string): ChecklistItemDetailView {
  return {
    auditMetrics: [
      { label: 'Eventos', value: '0' },
      { label: 'Documento', value: '0' },
      { label: 'Pendências', value: '0' },
    ],
    caseLabel: `Caso ${caseId.slice(0, 8)}`,
    documentLabel: 'Nenhum documento vinculado',
    extractedFields: [],
    hasDocument: false,
    historyEvents: [],
    itemPositionLabel: 'Não informado',
    pendingItems: [],
    statusLabel: 'Item não encontrado',
    statusVariant: 'secondary',
  }
}

function getPendingItems({
  checklistItem,
  document,
}: {
  checklistItem: CaseChecklistItem
  document?: DocumentValidationDocument
}): ChecklistItemPending[] {
  if (checklistItem.status === 'validated') return []

  if (document?.status === DocumentValidationStatus.ResendRequested) return []

  if (!checklistItem.documentFileId) {
    return [
      {
        description: 'Nenhum arquivo foi recebido para este item do checklist.',
        id: 'document-not-received',
        title: 'Documento não recebido',
      },
    ]
  }

  if (document?.missingFields.length) {
    return document.missingFields.map((field) => ({
      description: `Campo obrigatório não identificado no documento recebido: ${field}.`,
      id: field,
      title: field,
    }))
  }

  return []
}

function getReviewerDisplayName({
  fallbackReviewerId,
  reviewerName,
}: {
  fallbackReviewerId?: string
  reviewerName?: string
}) {
  if (reviewerName?.trim()) return reviewerName.trim()

  if (fallbackReviewerId && !isUuid(fallbackReviewerId)) return fallbackReviewerId

  return 'responsável identificado no registro'
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )
}
