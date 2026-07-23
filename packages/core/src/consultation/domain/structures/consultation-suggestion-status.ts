export const ConsultationSuggestionStatus = {
  Pending: 'pending',
  Accepted: 'accepted',
  Rejected: 'rejected',
} as const

export type ConsultationSuggestionStatus =
  (typeof ConsultationSuggestionStatus)[keyof typeof ConsultationSuggestionStatus]
