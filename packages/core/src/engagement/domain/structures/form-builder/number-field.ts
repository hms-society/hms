import type { FormFieldType } from './form-field-type'

export type NumberField = {
  type: typeof FormFieldType.Number
  id: string
  label: string
  required: boolean
  helpText?: string
  min?: number
  max?: number
  decimals?: number
  value?: number
}
