export const ConsultationFormFieldType = {
  ShortText: 'short_text',
  LongText: 'long_text',
  Date: 'date',
  YesNo: 'yes_no',
  MultipleChoice: 'multiple_choice',
} as const

export type ConsultationFormFieldType =
  (typeof ConsultationFormFieldType)[keyof typeof ConsultationFormFieldType]
