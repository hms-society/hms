import type { DynamicFormAnswerValue } from '#shared/domain/structures/dynamic-form-answer-value'
import type { DynamicFormFieldType } from '#shared/domain/structures/dynamic-form-field-type'
import type { DynamicFormFieldValidation } from '#shared/domain/structures/dynamic-form-field-validation'
import type { Entity } from '#shared/domain/entities/entity'

import type { DynamicFormDefinitionOption } from './dynamic-form-definition-option'

export type DynamicFormDefinitionField = Entity & {
  key: string
  label: string
  type: DynamicFormFieldType
  position: number
  required: boolean
  description?: string
  placeholder?: string
  defaultValue?: Exclude<DynamicFormAnswerValue, null>
  options?: DynamicFormDefinitionOption[]
  validation?: DynamicFormFieldValidation
  currency?: 'BRL'
}
