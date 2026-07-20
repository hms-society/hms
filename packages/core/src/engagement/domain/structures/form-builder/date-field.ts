import type { FormFieldType } from './form-field-type'

export type DateField = {
  type: typeof FormFieldType.Date
  id: string
  label: string
  required: boolean
  helpText?: string
  minDate?: Date
  maxDate?: Date
  value?: Date
}
