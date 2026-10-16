import type { CaseChecklistItem } from './case-checklist-item'

export type CaseChecklistItemCreation = Omit<
  CaseChecklistItem,
  | 'waiver'
  | 'createdAt'
  | 'documentReference'
  | 'documentFileId'
  | 'documentFileName'
  | 'id'
  | 'status'
  | 'updatedAt'
  | 'validatedAt'
  | 'validatedBy'
>
