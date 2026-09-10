import type { ChecklistDocumentType } from '@hms/core/case-management/domain/structures'

export type LegalArea = {
  id: string
  name: string
  documentCount: number
  templateId?: string
}

export type DocumentFileType = ChecklistDocumentType

export type ChecklistDocument = {
  id: string
  name: string
  types: readonly DocumentFileType[]
  required: boolean
}
