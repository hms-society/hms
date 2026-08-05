import type {
  ConsultationFormFieldOption,
  ConsultationFormFieldType,
} from '../structures'

type ConsultationFormFieldBase = {
  id: string
  templateId: string
  label: string
  required: boolean
  description?: string
  placeholder?: string
  position: number
}

type ChoiceConsultationFormField = ConsultationFormFieldBase & {
  type: typeof ConsultationFormFieldType.MultipleChoice
  options: ConsultationFormFieldOption[]
}

type TextualConsultationFormField = ConsultationFormFieldBase & {
  type:
    | typeof ConsultationFormFieldType.ShortText
    | typeof ConsultationFormFieldType.LongText
  options?: never
}

type DateConsultationFormField = ConsultationFormFieldBase & {
  type: typeof ConsultationFormFieldType.Date
  options?: never
}

type YesNoConsultationFormField = ConsultationFormFieldBase & {
  type: typeof ConsultationFormFieldType.YesNo
  options?: never
}

export type ConsultationFormField =
  | ChoiceConsultationFormField
  | TextualConsultationFormField
  | DateConsultationFormField
  | YesNoConsultationFormField
