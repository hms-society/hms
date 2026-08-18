export const AiSuggestionStatus = {
  Pending: 'pending',
  Accepted: 'accepted',
  Adjusted: 'adjusted',
  Rejected: 'rejected',
  Blocked: 'blocked',
} as const

export type AiSuggestionStatus =
  (typeof AiSuggestionStatus)[keyof typeof AiSuggestionStatus]
