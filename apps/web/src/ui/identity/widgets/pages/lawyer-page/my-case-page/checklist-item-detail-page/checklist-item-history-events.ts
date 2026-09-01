import type { CaseChecklistItem } from '@hms/core/case-management/domain/entities'
import type {
  DocumentValidationDocument,
  DocumentValidationLog,
} from '@hms/core/document-engine/domain/entities'
import { DocumentValidationLogAction } from '@hms/core/document-engine/domain/structures'

import {
  getChecklistDocumentStatusLabel,
  getChecklistDocumentStatusView,
} from '../checklist-document-status'

export type ChecklistItemHistoryEvent = {
  badge?: string
  description: string
  icon: 'calendar-clock' | 'check-circle-2' | 'file-text' | 'history'
  id: string
  title: string
}

export function getChecklistItemHistoryEvents({
  checklistItem,
  document,
  documentLogs,
  reviewedAt,
  reviewedBy,
  statusLabel,
}: {
  checklistItem: CaseChecklistItem
  document?: DocumentValidationDocument
  documentLogs: DocumentValidationLog[]
  reviewedAt?: Date
  reviewedBy: string
  statusLabel: string
}): ChecklistItemHistoryEvent[] {
  const events: ChecklistItemHistoryEvent[] = [
    {
      badge: 'Item',
      description: `Checklist instanciado em ${formatDateTime(checklistItem.createdAt)}.`,
      icon: 'history',
      id: 'checklist-created',
      title: 'Item instanciado no checklist',
    },
  ]

  if (document) {
    events.unshift({
      badge: getChecklistDocumentStatusView({
        document,
        hasDocument: true,
        isValidated: checklistItem.status === 'validated',
      }).badge,
      description: `Documento recebido em ${formatDateTime(document.receivedAt)}.`,
      icon: 'file-text',
      id: 'document-received',
      title: 'Arquivo recebido pelo Motor Documental',
    })
  }

  const logEvents = documentLogs.map((log) =>
    getDocumentLogHistoryEvent({
      log,
      reviewedBy,
    }),
  )

  if (logEvents.length > 0) return [...logEvents, ...events]

  if (reviewedAt) {
    events.unshift(
      getFallbackDocumentReviewedEvent({
        reviewedAt,
        reviewedBy,
        statusLabel,
      }),
    )
  }

  return events
}

function getDocumentLogHistoryEvent({
  log,
  reviewedBy,
}: {
  log: DocumentValidationLog
  reviewedBy: string
}): ChecklistItemHistoryEvent {
  if (log.action === DocumentValidationLogAction.ResendRequested) {
    return {
      badge: 'Reenvio solicitado',
      description: getDecisionDescription({
        actionLabel: 'Reenvio solicitado',
        createdAt: log.createdAt,
        reason: log.reason,
        reviewedBy,
      }),
      icon: 'calendar-clock',
      id: log.id,
      title: 'Reenvio solicitado',
    }
  }

  if (log.action === DocumentValidationLogAction.AiCorrectionRecorded) {
    return {
      badge: 'Correção IA',
      description: getDecisionDescription({
        actionLabel: 'Correção da IA registrada',
        createdAt: log.createdAt,
        reason: log.reason,
        reviewedBy,
      }),
      icon: 'history',
      id: log.id,
      title: 'Correção da IA registrada',
    }
  }

  const statusLabel = getChecklistDocumentStatusLabel(log.status)

  return {
    badge: 'Decisão',
    description: getDecisionDescription({
      actionLabel: statusLabel,
      createdAt: log.createdAt,
      reason: log.reason,
      reviewedBy,
    }),
    icon: 'check-circle-2',
    id: log.id,
    title: 'Decisão registrada',
  }
}

function getFallbackDocumentReviewedEvent({
  reviewedAt,
  reviewedBy,
  statusLabel,
}: {
  reviewedAt: Date
  reviewedBy: string
  statusLabel: string
}): ChecklistItemHistoryEvent {
  return {
    badge: 'Decisão',
    description: `${statusLabel} por ${reviewedBy} em ${formatDateTime(reviewedAt)}.`,
    icon: 'check-circle-2',
    id: 'document-reviewed',
    title: 'Decisão registrada',
  }
}

function getDecisionDescription({
  actionLabel,
  createdAt,
  reason,
  reviewedBy,
}: {
  actionLabel: string
  createdAt: Date
  reason?: string
  reviewedBy: string
}) {
  const reasonDescription = reason ? ` Motivo: ${reason}.` : ''

  return `${actionLabel} por ${reviewedBy} em ${formatDateTime(createdAt)}.${reasonDescription}`
}

function formatDateTime(value: Date | string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}
