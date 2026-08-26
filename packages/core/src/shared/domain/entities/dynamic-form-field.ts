import type { DynamicFormFieldOption } from '../structures/dynamic-form-field-option'
import type { DynamicFormFieldValidation } from '../structures/dynamic-form-field-validation'
import type { DynamicFormFieldType } from '../structures/dynamic-form-field-type'
import type { Entity } from './entity'

export type DynamicFormField = Entity & {
  key: string
  label: string
  type: DynamicFormFieldType
  position: number
  required: boolean
  description?: string
  placeholder?: string
  options?: DynamicFormFieldOption[]
  validation?: DynamicFormFieldValidation
}
