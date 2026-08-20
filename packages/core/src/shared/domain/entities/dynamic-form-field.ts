import type { DynamicFormFieldOption } from '../structures/dynamic-form-field-option'
import type { DynamicFormFieldType } from '../structures/dynamic-form-field-type'

export type DynamicFormField = {
  id: string
  key: string
  label: string
  type: DynamicFormFieldType
  position: number
  required: boolean
  description?: string
  placeholder?: string
  options?: readonly DynamicFormFieldOption[]
}
