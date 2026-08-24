import type { DynamicFormField } from './dynamic-form-field'
import type { DynamicFormContext } from '../structures/dynamic-form-context'
import type { DynamicFormStatus } from '../structures/dynamic-form-status'
import type { Entity } from './entity'

export type DynamicForm = Entity & {
  name: string
  description?: string
  status: DynamicFormStatus
  contexts: DynamicFormContext[]
  fields: DynamicFormField[]
  createdAt: Date
  updatedAt: Date
}
