import type { Entity } from '#shared/domain/entities/entity'

import type { DynamicFormDefinitionField } from './dynamic-form-definition-field'
import type { DynamicFormStage } from '../structures/dynamic-form-stage'
import type { DynamicFormStatus } from '../structures/dynamic-form-status'

export type DynamicForm = Entity & {
  name: string
  normalizedName: string
  description: string | null
  status: DynamicFormStatus
  stage: DynamicFormStage
  legalAreaId: string
  legalTopicIds: string[]
  fields: DynamicFormDefinitionField[]
  version: number
  createdAt: Date
  updatedAt: Date
}
