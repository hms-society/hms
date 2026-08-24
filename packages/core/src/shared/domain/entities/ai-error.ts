import type { Entity } from './entity'

export type AiError = Entity & {
  suggestionId: string
  entityId: string
  suggestionType: string
  suggestedContent: string
  rejectionReason: string
  createdAt: Date
  createdByCollaboratorId: string
}
