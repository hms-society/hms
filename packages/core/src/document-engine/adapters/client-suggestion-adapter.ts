import type { AiSuggestion } from '../../shared/domain/structures/ai-suggestion'
import type { AiSuggestionAdapter } from '../../shared/interfaces/ai-suggestion-adapter'
import type { ClientSuggestion } from '../domain/entities/client-suggestion'

export class ClientSuggestionAdapter implements AiSuggestionAdapter<ClientSuggestion> {
  adapt(source: ClientSuggestion): AiSuggestion {
    const isHighConfidence = source.score >= 0.8

    return {
      id: source.id,
      entityId: source.documentBatchId,
      entityType: 'document_batch',
      suggestionType: 'client_link',
      content: `Vincular lote ao cliente ${source.clientId}`,
      confidence: isHighConfidence ? 'high' : 'low',
      status:
        source.status === 'accepted'
          ? 'accepted'
          : source.status === 'rejected'
            ? 'rejected'
            : 'pending',
      reviewedAt: source.reviewedAt,
      reviewedByCollaboratorId: source.reviewedByCollaboratorId,
      suggestedAt: source.suggestedAt,
      metadata: {
        score: source.score,
        evidence: source.evidence,
        clientId: source.clientId,
      },
    }
  }
}
