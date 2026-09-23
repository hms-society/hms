import type { Pending } from '@hms/core/case-management/domain/entities'

import type { ChecklistItemHistoryEvent } from './checklist-item-history-events'

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
