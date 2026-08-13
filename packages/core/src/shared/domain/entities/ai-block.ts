export type AiBlock = {
  readonly id: string
  readonly suggestionId: string
  readonly entityId: string
  readonly suggestionType: string
  readonly blockedAt: Date
  readonly blockedByCollaboratorId: string
  readonly isUnblocked: boolean
}
