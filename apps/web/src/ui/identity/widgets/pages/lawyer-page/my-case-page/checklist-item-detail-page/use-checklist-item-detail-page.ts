import { useQuery } from '@tanstack/react-query'

import type { CaseChecklistItem } from '@hms/core/case-management/domain/entities'
import type { Pending } from '@hms/core/case-management/domain/entities'
import { createAssistedMessage } from '@hms/core/case-management/use-cases'
import { PendingReason } from '@hms/core/case-management/domain/structures'
import type {
  DocumentValidationDocument,
  DocumentValidationLog,
} from '@hms/core/document-engine/domain/entities'

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
  body: string
  description: string
  documentFileName?: string
  id: string
  messageId?: string
  reason: Pending['reason']
  subject: string
  status: string
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
  const { data: casePendings = [], error: pendingsError } = useQuery({
    queryKey: ['case-management', 'cases', caseId, 'pendencies'],
    queryFn: async () => {
      const response = await caseManagementService.listCasePendings(caseId)
      if (response.isFailure) response.throwError()
      return response.body
    },
    enabled: Boolean(caseId),
  })
  const { data: legalCase } = useQuery({
    queryKey: ['case-management', 'cases', caseId],
    queryFn: async () => {
      const response = await caseManagementService.getLegalCaseDetails(caseId)
      if (response.isFailure) response.throwError()
      return response.body
    },
    enabled: Boolean(caseId),
  })
  const itemPendings = casePendings.filter(
    (pending) => pending.checklistItemId === checklistItemId && !pending.cancelledAt,
  )
  const { data: pendingMessages = [], error: pendingMessagesError } = useQuery({
    queryKey: ['case-management', 'pendencies', checklistItemId, 'messages'],
    queryFn: async () => {
      return Promise.all(
        itemPendings.map(async (pending) => {
          const response = await caseManagementService.getPendingMessage(pending.id)
          if (response.isFailure) response.throwError()
          return { message: response.body, pending }
        }),
      )
    },
    enabled: itemPendings.length > 0,
  })
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
    pendings: pendingMessages,
    clientName: legalCase?.clientName,
    itemIndex: checklistItem
      ? checklistItems.findIndex((item) => item.id === checklistItem.id)
      : -1,
    totalItemsCount: checklistItems.length,
  })
  const isLoading =
    isLoadingChecklist ||
    Boolean(documentFileId && (isLoadingDocument || isLoadingDocumentLogs))
  const error =
    checklistError ?? documentError ?? documentLogsError ?? pendingsError ?? pendingMessagesError

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
  pendings,
  clientName,
  itemIndex,
  totalItemsCount,
}: {
  caseId: string
  checklistItem?: CaseChecklistItem
  document?: DocumentValidationDocument
  documentLogs: DocumentValidationLog[]
  pendings: readonly {
    pending: Pending
    message: {
      body: string
      id?: string
      status?: string
      subject: string
    }
  }[]
  clientName?: string
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
  const activePendings = pendings.length > 0 || hasDocument
    ? pendings
    : [{
        pending: {
          id: `missing-document-${checklistItem.id}`,
          caseId: checklistItem.caseId,
          checklistItemId: checklistItem.id,
          reason: PendingReason.Missing,
          details: undefined,
          documentFileName: undefined,
          responsibleId: 'system',
          createdAt: checklistItem.createdAt,
        } satisfies Pending,
        message: createAssistedMessage({
          reason: PendingReason.Missing,
          documentFileName: checklistItem.title,
          clientName,
        }),
      }]
  const pendingItems = activePendings.map(({ pending, message }) => ({
    body: message.body,
    description: pending.details ?? getPendingReasonLabel(pending.reason),
    documentFileName: pending.documentFileName,
    id: pending.id,
    messageId: 'id' in message ? message.id : undefined,
    reason: pending.reason,
    subject: message.subject,
    status: 'status' in message ? message.status ?? 'awaiting_approval' : 'awaiting_approval',
    title: getPendingReasonLabel(pending.reason),
  }))
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

function getPendingReasonLabel(reason: Pending['reason']) {
  const labels: Record<Pending['reason'], string> = {
    duplicate: 'Documento duplicado',
    illegible: 'Ilegível',
    incomplete: 'Documento incompleto',
    missing: 'Documento não recebido',
    not_corresponding: 'Não correspondente',
  }

  return labels[reason]
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
