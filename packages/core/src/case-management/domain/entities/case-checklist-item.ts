import type { ChecklistDocumentWaiver } from '../structures/checklist-document-waiver'
import type { Entity } from '#shared/domain/entities/entity'
import type { ChecklistDocumentReference } from '../structures/checklist-document-reference'
import type { CaseChecklistItemStatus } from '../structures'

export type CaseChecklistItem = Entity & {
  caseId: string
  templateItemKey: string
  checklistTemplateName?: string
  title: string
  isRequired: boolean
  status: CaseChecklistItemStatus
  waiver?: ChecklistDocumentWaiver
  documentReference?: ChecklistDocumentReference
  documentFileId?: string
  documentFileName?: string
  validatedAt?: Date
  validatedBy?: string
  createdAt: Date
  updatedAt: Date
}
