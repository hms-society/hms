export const DocumentGenerationMoment = {
  Consultation: 'consultation',
  Formalization: 'formalization',
  LegalProduction: 'legal_production',
} as const

export type DocumentGenerationMoment =
  (typeof DocumentGenerationMoment)[keyof typeof DocumentGenerationMoment]
