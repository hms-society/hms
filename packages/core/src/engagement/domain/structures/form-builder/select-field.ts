import { FormFieldType } from './form-field-type'
import type { SelectOption } from './select-option'

export type SelectField = {
  type: typeof FormFieldType.Select
  id: string
  label: string
  required: boolean
  helpText?: string
  options: SelectOption[]
  value?: string
}
