import type { DynamicFormAnswerValue, DynamicFormField } from '@hms/core/shared/domain'

export type SelectedFormSectionProps = {
  selectedFormName: string
  legalArea?: string
  legalTheme?: string
  fields: readonly DynamicFormField[]
  answers: Readonly<Record<string, DynamicFormAnswerValue>>
  errors: Readonly<Record<string, string>>
  onChange: (fieldId: string, value: DynamicFormAnswerValue) => void
  onOpenSelectModal: () => void
  isReadOnly?: boolean
}
