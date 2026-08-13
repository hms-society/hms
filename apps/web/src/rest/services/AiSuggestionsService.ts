import type { RestClient } from '@hms/core/shared/interfaces'
import type { AiSuggestion } from '@hms/core/shared/domain/structures'

export type RegisterFeedbackPayload = {
  action: 'accept' | 'adjust' | 'reject' | 'block'
  adjustedContent?: string
  rejectionReason?: string
}

export const AiSuggestionsService = (client: RestClient) => {
  return {
    getAiSuggestions: async (entityId: string) => {
      return client.get<AiSuggestion[]>(`/ai-suggestions?entityId=${entityId}`)
    },
    sendFeedback: async (suggestionId: string, payload: RegisterFeedbackPayload) => {
      return client.post<AiSuggestion>(`/ai-suggestions/${suggestionId}/feedback`, payload)
    },
  }
}
