import type { AiSuggestionStatus } from './ai-suggestion-status'

export type AiSuggestion = {
  readonly id: string
  readonly entityId: string
  readonly entityType: string
  readonly suggestionType: string
  readonly content: string
  readonly adjustedContent?: string
  readonly rejectionReason?: string
  readonly confidence?: 'high' | 'low' | number
  readonly status: AiSuggestionStatus
  readonly reviewedAt?: Date
  readonly reviewedByCollaboratorId?: string
  readonly suggestedAt: Date
  readonly metadata?: Record<string, unknown>
}
