export const DynamicFormFieldType = {
  ShortText: 'short_text',
  LongText: 'long_text',
  Date: 'date',
  Boolean: 'boolean',
  MultipleSelection: 'multiple_selection',
  SingleSelection: 'single_selection',
  Integer: 'integer',
  Currency: 'currency',
  Percentage: 'percentage',
} as const

export type DynamicFormFieldType =
  (typeof DynamicFormFieldType)[keyof typeof DynamicFormFieldType]
