import type { Entity } from '#shared/domain/entities/entity'
import type { PendingReason } from '../structures'

export type Pending = Entity & {
  caseId: string
  checklistItemId: string
  documentFileId?: string
  documentFileName?: string
  reason: PendingReason
  details?: string
  responsibleId: string
  createdAt: Date
  cancelledAt?: Date
  cancelledBy?: string
}
