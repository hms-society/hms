export const ClientSuggestionStatus = {
  Pending: 'pending',
  Accepted: 'accepted',
  Rejected: 'rejected',
} as const

export type ClientSuggestionStatus =
  (typeof ClientSuggestionStatus)[keyof typeof ClientSuggestionStatus]
