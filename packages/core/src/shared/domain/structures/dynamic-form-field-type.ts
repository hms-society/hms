export const DynamicFormFieldType = {
  ShortText: 'short_text',
  LongText: 'long_text',
  Date: 'date',
  Boolean: 'boolean',
  MultipleSelection: 'multiple_selection',
} as const

export type DynamicFormFieldType =
  (typeof DynamicFormFieldType)[keyof typeof DynamicFormFieldType]
