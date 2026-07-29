export const ConsultationSuggestionTarget = {
  PrimaryLegalQuestion: 'primary_legal_question',
  RelevantFact: 'relevant_fact',
  PotentialLegalRequest: 'potential_legal_request',
  IdentifiedRisk: 'identified_risk',
} as const

export type ConsultationSuggestionTarget =
  (typeof ConsultationSuggestionTarget)[keyof typeof ConsultationSuggestionTarget]
