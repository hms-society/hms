import type { DynamicFormFieldType } from '#shared/domain/structures/dynamic-form-field-type'
import type { DynamicFormFieldValidation } from '#shared/domain/structures/dynamic-form-field-validation'

import type { DynamicFormStage } from './dynamic-form-stage'

type DynamicFormDefinitionOptionDraft = {
  optionId?: string
  label: string
}

type DynamicFormDefinitionFieldDraftBase = {
  fieldId?: string
  label: string
  type: DynamicFormFieldType
  required: boolean
  description?: string
  validation?: DynamicFormFieldValidation
}

type DynamicFormDefinitionFieldDraft =
  | (DynamicFormDefinitionFieldDraftBase & {
      type: 'short_text' | 'long_text'
      placeholder?: string
      defaultValue?: string
    })
  | (DynamicFormDefinitionFieldDraftBase & {
      type: 'date'
      defaultValue?: string
    })
  | (DynamicFormDefinitionFieldDraftBase & {
      type: 'boolean'
      defaultValue?: boolean
    })
  | (DynamicFormDefinitionFieldDraftBase & {
      type: 'single_selection'
      placeholder?: string
      options: DynamicFormDefinitionOptionDraft[]
      defaultOptionIndex?: number
    })
  | (DynamicFormDefinitionFieldDraftBase & {
      type: 'multiple_selection'
      options: DynamicFormDefinitionOptionDraft[]
      defaultOptionIndexes?: number[]
    })
  | (DynamicFormDefinitionFieldDraftBase & {
      type: 'integer' | 'percentage'
      placeholder?: string
      defaultValue?: number
    })
  | (DynamicFormDefinitionFieldDraftBase & {
      type: 'currency'
      placeholder?: string
      defaultValue?: number
      currency: 'BRL'
    })

export type DynamicFormDefinitionDraft = {
  name: string
  description?: string
  stage: DynamicFormStage
  legalAreaId: string
  legalTopicIds: string[]
  fields: DynamicFormDefinitionFieldDraft[]
}
