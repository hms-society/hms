import type { Entity } from '#shared/domain/entities/entity'
import type { ChecklistDocumentType } from '../structures'

export type ChecklistTemplateItem = Entity & {
  checklistTemplateId: string
  title: string
  documentTypes: readonly ChecklistDocumentType[]
  isRequired: boolean
  position: number
  updatedAt: Date
  updatedBy?: string
}

export type ChecklistTemplateItemCreation = Omit<
  ChecklistTemplateItem,
  'id' | 'updatedAt'
>
