export const DocumentGenerationMoment = {
  Consultation: 'consultation',
  Formalization: 'formalization',
  Case: 'case',
} as const

export type DocumentGenerationMoment =
  (typeof DocumentGenerationMoment)[keyof typeof DocumentGenerationMoment]
