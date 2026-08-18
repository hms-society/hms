export type AiError = {
  readonly id: string
  readonly suggestionId: string
  readonly entityId: string
  readonly suggestionType: string
  readonly suggestedContent: string
  readonly rejectionReason: string
  readonly createdAt: Date
  readonly createdByCollaboratorId: string
}
