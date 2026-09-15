import type { DynamicFormField } from '#shared/domain/entities/dynamic-form-field'
import type { Entity } from '#shared/domain/entities/entity'

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
  fields: DynamicFormField[]
  createdAt: Date
  updatedAt: Date
}
