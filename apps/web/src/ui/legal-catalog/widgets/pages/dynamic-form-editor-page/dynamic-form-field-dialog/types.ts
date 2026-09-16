import type { DynamicFormStage } from '@hms/core/legal-catalog/domain/structures'

import type { DynamicFormEditorField } from '../types'
import type { DynamicFormEditorOptionError } from '../types'

export type DynamicFormFieldDialogProps = {
  open: boolean
  mode: 'create' | 'edit'
  stage: DynamicFormStage
  legalAreaName: string
  legalTopicNames: readonly string[]
  initialValue?: DynamicFormEditorField
  onOpenChange: (open: boolean) => void
  onSubmit: (field: DynamicFormEditorField) => void
}

export type DynamicFormFieldDialogState = {
  field: DynamicFormEditorField
  error: string | null
  errors: {
    description?: string
    label?: string
    placeholder?: string
    defaultValue?: string
    validation?: string
    min?: string
    max?: string
    scale?: string
    optionErrors: readonly DynamicFormEditorOptionError[]
  }
}
