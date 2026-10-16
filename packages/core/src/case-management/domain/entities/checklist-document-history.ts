import type { Entity } from '../../../shared/domain/entities/entity'
import type { ChecklistDocumentReference, ChecklistDocumentWaiver } from '../structures'
export type ChecklistDocumentHistory = Entity & {
  caseId: string
  checklistItemId: string
  actorId: string
  createdAt: Date
} & (
    | { action: 'attached' | 'validated'; reference: ChecklistDocumentReference }
    | { action: 'waiver_granted' | 'waiver_revoked'; reference: ChecklistDocumentWaiver }
    | {
        action: 'waiver_replaced'
        reference: {
          document: ChecklistDocumentReference
          waiver: ChecklistDocumentWaiver
        }
      }
  )
