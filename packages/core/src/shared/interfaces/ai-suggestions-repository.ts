import type { AiSuggestion, AiSuggestionStatus } from '../domain/structures'
import type { AiError, AiBlock } from '../domain/entities'

export type UpdateAiFeedbackParams = {
  id: string
  status: AiSuggestionStatus
  adjustedContent?: string
  rejectionReason?: string
  reviewedByCollaboratorId: string
  reviewedAt: Date
}

export interface AiSuggestionsRepository {
  findByEntityId(entityId: string): Promise<AiSuggestion[]>
  findById(id: string): Promise<AiSuggestion | null>
  add(suggestion: Omit<AiSuggestion, 'id'>): Promise<AiSuggestion>
  updateFeedback(params: UpdateAiFeedbackParams): Promise<AiSuggestion>
  createErrorLog(error: Omit<AiError, 'id'>): Promise<AiError>
  createBlockRule(block: Omit<AiBlock, 'id'>): Promise<AiBlock>
}
