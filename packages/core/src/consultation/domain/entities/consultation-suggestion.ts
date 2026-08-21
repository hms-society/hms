import type {
  ConsultationSuggestionStatus,
  ConsultationSuggestionTarget,
} from '../structures'
import type { Entity } from '../../../shared/domain/entities/entity'

type ConsultationSuggestionBase = Entity & {
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
