import type { Entity } from './entity'

export type AiBlock = Entity & {
  suggestionId: string
  entityId: string
  suggestionType: string
  blockedAt: Date
  blockedByCollaboratorId: string
  isUnblocked: boolean
}
