import { FormFieldType } from './form-field-type'
import type { SelectOption } from './select-option'

export type MultiSelectField = {
  type: typeof FormFieldType.MultiSelect
  id: string
  label: string
  required: boolean
  helpText?: string
  options: SelectOption[]
  minSelections?: number
  maxSelections?: number
  value?: string[]
}
