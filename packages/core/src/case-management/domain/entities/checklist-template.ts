import type { Entity } from '#shared/domain/entities/entity'
import type { ChecklistTemplateItem } from './checklist-template-item'

export type ChecklistTemplate = Entity & {
  legalAreaId: string
  name: string
  isActive: boolean
  items: readonly ChecklistTemplateItem[]
  updatedAt: Date
  updatedBy?: string
}

export type ChecklistTemplateCreation = Omit<
  ChecklistTemplate,
  'id' | 'items' | 'updatedAt'
>
