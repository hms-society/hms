import type { FormFieldType } from './form-field-type'

export type LongTextField = {
  type: typeof FormFieldType.LongText
  id: string
  label: string
  required: boolean
  helpText?: string
  minLength?: number
  maxLength?: number
  value?: string
}
