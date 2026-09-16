import type { Entity } from '#shared/domain/entities/entity'
import type { AssistedMessageStatus } from '../structures'

export type AssistedMessage = Entity & {
  pendingId: string
  caseId: string
  checklistItemId: string
  subject: string
  body: string
  sendingInstructions: string
  status: AssistedMessageStatus
  createdAt: Date
  updatedAt: Date
  approvedAt?: Date
  approvedBy?: string
}
