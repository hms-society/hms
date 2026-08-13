import type { AiSuggestion } from '../../shared/domain/structures/ai-suggestion'
import type { AiSuggestionAdapter } from '../../shared/interfaces/ai-suggestion-adapter'
import type { ConsultationSuggestion } from '../domain/entities/consultation-suggestion'

export class ConsultationSuggestionAdapter
  implements AiSuggestionAdapter<ConsultationSuggestion>
{
  adapt(source: ConsultationSuggestion): AiSuggestion {
    return {
      id: source.id,
      entityId: source.consultationId,
      entityType: 'consultation',
      suggestionType: source.target,
      content: source.content,
      confidence: 'high',
      status:
        source.status === 'accepted'
          ? 'accepted'
          : source.status === 'rejected'
            ? 'rejected'
            : 'pending',
      reviewedAt: source.reviewedAt,
      reviewedByCollaboratorId: source.reviewedByCollaboratorId,
      suggestedAt: source.suggestedAt,
    }
  }
}
