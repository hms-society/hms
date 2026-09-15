export const DynamicFormStage = {
  Consultation: 'consultation',
  Formalization: 'formalization',
} as const

export type DynamicFormStage = (typeof DynamicFormStage)[keyof typeof DynamicFormStage]
