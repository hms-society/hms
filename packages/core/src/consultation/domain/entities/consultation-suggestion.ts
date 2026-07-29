import type {
  ConsultationSuggestionStatus,
  ConsultationSuggestionTarget,
} from '../structures'

type ConsultationSuggestionBase = {
  id: string
  consultationId: string
  target: ConsultationSuggestionTarget
  content: string
  suggestedAt: Date
}

type PendingConsultationSuggestion = ConsultationSuggestionBase & {
  status: typeof ConsultationSuggestionStatus.Pending
  reviewedAt?: never
  reviewedByCollaboratorId?: never
}

type ReviewedConsultationSuggestion = ConsultationSuggestionBase & {
  status:
    | typeof ConsultationSuggestionStatus.Accepted
    | typeof ConsultationSuggestionStatus.Rejected
  reviewedAt: Date
  reviewedByCollaboratorId: string
}

export type ConsultationSuggestion =
  | PendingConsultationSuggestion
  | ReviewedConsultationSuggestion
