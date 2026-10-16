import type { Entity } from '../../../shared/domain/entities/entity'
import type { CaseChecklistItem } from './case-checklist-item'
export type ChecklistDocumentOperation = Entity & {
  caseId: string
  actorId: string
  operationId: string
  kind?: 'document' | 'waiver'
  fingerprint: string
  result: CaseChecklistItem
  createdAt: Date
}
