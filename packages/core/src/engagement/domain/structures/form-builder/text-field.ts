import type { FormFieldType } from './form-field-type'

export type TextField = {
  type: typeof FormFieldType.Text
  id: string
  label: string
  required: boolean
  helpText?: string
  maxLength?: number
  pattern?: string
  value?: string
}
