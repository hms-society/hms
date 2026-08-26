export const DynamicFormAnswerValidationMode = {
  Draft: 'draft',
  Complete: 'complete',
} as const

export type DynamicFormAnswerValidationMode =
  (typeof DynamicFormAnswerValidationMode)[keyof typeof DynamicFormAnswerValidationMode]
