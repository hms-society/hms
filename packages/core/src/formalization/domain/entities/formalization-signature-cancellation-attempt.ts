import type { Entity } from '#shared/domain/entities/entity'

export type FormalizationSignatureCancellationAttempt = Entity & {
  requestId: string
  attemptToken: string
  status: 'pending' | 'processing' | 'cancelled' | 'failed'
  attempts: number
  requestedBy: string
  reason: string
  requestedAt: Date
  leaseExpiresAt?: Date
  nextAttemptAt?: Date
  lastFailureCode?: string
  updatedAt: Date
}
