import { FormFieldType } from './form-field-type'

export type BooleanField = {
  type: typeof FormFieldType.Boolean
  id: string
  label: string
  required: boolean
  helpText?: string
  value?: boolean
}
