export const FormFieldType = {
  Text: 'text',
  LongText: 'long_text',
  Number: 'number',
  Date: 'date',
  Select: 'select',
  MultiSelect: 'multi_select',
  Boolean: 'boolean',
} as const

export type FormFieldType = (typeof FormFieldType)[keyof typeof FormFieldType]
