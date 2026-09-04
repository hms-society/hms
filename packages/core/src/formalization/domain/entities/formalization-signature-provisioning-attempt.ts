import type { Entity } from '#shared/domain/entities/entity'

export type FormalizationSignatureProvisioningAttempt = Entity & {
  requestId: string
  attemptToken: string
  status: 'pending' | 'processing' | 'provisioned' | 'reconciliation_required' | 'failed'
  attempts: number
  leaseExpiresAt?: Date
  nextAttemptAt?: Date
  lastFailureCode?: string
  createdAt: Date
  updatedAt: Date
}
