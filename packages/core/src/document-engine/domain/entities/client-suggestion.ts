import type { ClientSuggestionEvidence, ClientSuggestionStatus } from '../structures'
import type { Entity } from '../../../shared/domain/entities/entity'

type ClientSuggestionBase = Entity & {
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
