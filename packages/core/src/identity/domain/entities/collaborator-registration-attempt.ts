import type { Entity } from '../../../shared/domain/entities/entity'

export type CollaboratorRegistrationAttempt = Entity & {
  normalizedEmail: string
  payloadHash: string
  authUserId?: string
  status: 'pending_auth' | 'auth_invited' | 'completed' | 'reconciliation_required'
  lastError?: string
  createdAt: Date
  updatedAt: Date
}
