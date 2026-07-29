import type { ClientSuggestionEvidence, ClientSuggestionStatus } from '../structures'

type ClientSuggestionBase = {
  id: string
  documentBatchId: string
  clientId: string
  score: number
  evidence: ClientSuggestionEvidence[]
  suggestedAt: Date
}

type PendingClientSuggestion = ClientSuggestionBase & {
  status: typeof ClientSuggestionStatus.Pending
  reviewedAt?: never
  reviewedByCollaboratorId?: never
}

type ReviewedClientSuggestion = ClientSuggestionBase & {
  status: typeof ClientSuggestionStatus.Accepted | typeof ClientSuggestionStatus.Rejected
  reviewedAt: Date
  reviewedByCollaboratorId: string
}

export type ClientSuggestion = PendingClientSuggestion | ReviewedClientSuggestion
