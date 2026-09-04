import type { Entity } from '#shared/domain/entities/entity'

export type FormalizationSignatureWebhookReceipt = Entity & {
  dedupeKey: string
  hintKind: 'observation' | 'reconciliation_only'
  encryptedHint: string
  cipherKeyId: string
  status: 'pending' | 'processing' | 'processed' | 'failed'
  receivedAt: Date
  claimToken?: string
  leaseUntil?: Date
  attempts: number
  nextAttemptAt?: Date
  processedAt?: Date
}
