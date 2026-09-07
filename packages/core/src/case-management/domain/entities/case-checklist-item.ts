import type { Entity } from '#shared/domain/entities/entity'
import type { CaseChecklistItemStatus } from '../structures'

export type CaseChecklistItem = Entity & {
  caseId: string
  templateItemKey: string
  title: string
  isRequired: boolean
  status: CaseChecklistItemStatus
  documentFileId?: string
  documentFileName?: string
  validatedAt?: Date
  validatedBy?: string
  createdAt: Date
  updatedAt: Date
}

export type CaseChecklistItemCreation = Omit<
  CaseChecklistItem,
  | 'createdAt'
  | 'documentFileId'
  | 'documentFileName'
  | 'id'
  | 'status'
  | 'updatedAt'
  | 'validatedAt'
  | 'validatedBy'
>
