import { useQuery } from '@tanstack/react-query'

import type { Pending } from '@hms/core/case-management/domain/entities'

import { useDocumentValidationDocumentQuery } from '@/ui/document-engine/hooks/use-document-validation-document-query'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import type { ChecklistItemHistoryEvent } from './checklist-item-history-events'
import { getChecklistItemDetailView } from './checklist-item-detail-view'

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
  templateName: string
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
  isPersisted?: boolean
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
    templateName: checklistItem?.checklistTemplateName ?? legalCase?.legalArea,
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
