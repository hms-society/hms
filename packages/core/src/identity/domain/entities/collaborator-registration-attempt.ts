export type CollaboratorRegistrationAttempt = {
  readonly id: string
  readonly normalizedEmail: string
  readonly payloadHash: string
  readonly authUserId?: string
  readonly status:
    | 'pending_auth'
    | 'auth_invited'
    | 'completed'
    | 'reconciliation_required'
  readonly lastError?: string
  readonly createdAt: Date
  readonly updatedAt: Date
}
