import type { DynamicFormField } from './dynamic-form-field'
import type { DynamicFormContext } from '../structures/dynamic-form-context'
import type { DynamicFormStatus } from '../structures/dynamic-form-status'

export type DynamicForm = {
  id: string
  name: string
  description?: string
  status: DynamicFormStatus
  contexts: readonly DynamicFormContext[]
  fields: readonly DynamicFormField[]
  createdAt: Date
  updatedAt: Date
}
