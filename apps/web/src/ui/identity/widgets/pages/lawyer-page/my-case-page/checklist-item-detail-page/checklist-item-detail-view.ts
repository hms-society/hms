import type {
  CaseChecklistItem,
  Pending,
} from '@hms/core/case-management/domain/entities'
import { createAssistedMessage } from '@hms/core/case-management/use-cases'
import { PendingReason } from '@hms/core/case-management/domain/structures'
import type {
  DocumentValidationDocument,
  DocumentValidationLog,
} from '@hms/core/document-engine/domain/entities'
import { getVisibleExtractedFields } from '@/ui/document-engine/utils/get-visible-extracted-fields'

import { getChecklistDocumentStatusView } from '../checklist-document-status'
import { getChecklistItemHistoryEvents } from './checklist-item-history-events'
import type { ChecklistItemDetailView } from './checklist-item-detail-types'

type PendingWithMessage = {
  pending: Pending
  message: {
    body: string
    id?: string
    status?: string
    subject: string
  }
}

export function getChecklistItemDetailView({
  caseId,
  checklistItem,
  document,
  documentLogs,
  pendings,
  clientName,
  templateName,
  itemIndex,
  totalItemsCount,
}: {
  caseId: string
  checklistItem?: CaseChecklistItem
  document?: DocumentValidationDocument
  documentLogs: DocumentValidationLog[]
  pendings: readonly PendingWithMessage[]
  clientName?: string
  templateName?: string
  itemIndex: number
  totalItemsCount: number
}): ChecklistItemDetailView {
  if (!checklistItem) return getEmptyChecklistItemDetailView(caseId)

  const hasDocument = Boolean(checklistItem.documentFileId)
  const documentStatusView = getChecklistDocumentStatusView({
    document,
    hasDocument,
    isValidated: checklistItem.status === 'validated',
  })
  const pendingReason = document ? getPendingReasonForDocument(document) : undefined
  const activePendings =
    pendings.length > 0
      ? pendings
      : pendingReason && document
        ? [createDocumentPending(checklistItem, document, pendingReason, clientName)]
        : hasDocument
          ? []
          : [createMissingDocumentPending(checklistItem, clientName)]
  const pendingItems = activePendings.map(({ pending, message }) => ({
    body: message.body,
    description: pending.details ?? getPendingReasonLabel(pending.reason),
    documentFileName: pending.documentFileName,
    id: pending.id,
    isPersisted:
      !pending.id.startsWith('document-pending-') &&
      !pending.id.startsWith('missing-document-'),
    messageId: message.id,
    reason: pending.reason,
    subject: message.subject,
    status: message.status ?? 'awaiting_approval',
    title: getPendingReasonLabel(pending.reason),
  }))
  const documentLabel =
    checklistItem.documentFileName ?? document?.fileName ?? 'Nenhum documento vinculado'
  const reviewedBy = getReviewerDisplayName({
    fallbackReviewerId: checklistItem.validatedBy ?? document?.reviewedBy,
    reviewerName: document?.reviewedByName,
  })
  const reviewedAt = checklistItem.validatedAt ?? document?.reviewedAt
  const statusLabel = documentStatusView.label
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
    extractedFields:
      (document ? getVisibleExtractedFields(document) : []).map((field) => ({
        label: field.label,
        value: field.value || 'Não identificado',
      })) ?? [],
    hasDocument,
    historyEvents,
    itemPositionLabel:
      itemIndex >= 0
        ? `${itemIndex + 1} de ${Math.max(totalItemsCount, itemIndex + 1)}`
        : 'Não informado',
    pendingItems,
    statusLabel,
    statusVariant: documentStatusView.variant,
    templateName: templateName ?? 'Template não informado',
  }
}

function createDocumentPending(
  checklistItem: CaseChecklistItem,
  document: DocumentValidationDocument,
  reason: Pending['reason'],
  clientName?: string,
): PendingWithMessage {
  const documentFileName = checklistItem.documentFileName ?? document.fileName

  return {
    pending: {
      id: `document-pending-${checklistItem.id}`,
      caseId: checklistItem.caseId,
      checklistItemId: checklistItem.id,
      reason,
      details: document.humanCorrection?.reason,
      documentFileId: checklistItem.documentFileId,
      documentFileName,
      responsibleId: document.reviewedBy ?? 'system',
      createdAt: document.reviewedAt ?? checklistItem.createdAt,
    },
    message: createAssistedMessage({
      reason,
      documentFileName,
      details: document.humanCorrection?.reason,
      clientName,
    }),
  }
}

function createMissingDocumentPending(
  checklistItem: CaseChecklistItem,
  clientName?: string,
): PendingWithMessage {
  return {
    pending: {
      id: `missing-document-${checklistItem.id}`,
      caseId: checklistItem.caseId,
      checklistItemId: checklistItem.id,
      reason: PendingReason.Missing,
      details: undefined,
      documentFileName: undefined,
      responsibleId: 'system',
      createdAt: checklistItem.createdAt,
    },
    message: createAssistedMessage({
      reason: PendingReason.Missing,
      documentFileName: checklistItem.title,
      clientName,
    }),
  }
}

function getPendingReasonForDocument(
  document: DocumentValidationDocument,
): Pending['reason'] | undefined {
  const reasons: Partial<
    Record<DocumentValidationDocument['status'], Pending['reason']>
  > = {
    illegible: PendingReason.Illegible,
    incomplete: PendingReason.Incomplete,
    duplicate: PendingReason.Duplicate,
    not_corresponding: PendingReason.NotCorresponding,
  }

  return reasons[document.status]
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
    templateName: 'Template não informado',
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
