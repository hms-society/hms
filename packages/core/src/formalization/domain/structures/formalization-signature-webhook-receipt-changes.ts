import type { FormalizationSignatureWebhookReceipt } from '../entities/formalization-signature-webhook-receipt'

export type FormalizationSignatureWebhookReceiptChanges = {
  readonly status?: FormalizationSignatureWebhookReceipt['status']
  readonly claimToken?: string | null
  readonly leaseUntil?: Date | null
  readonly attempts?: number
  readonly nextAttemptAt?: Date
  readonly processedAt?: Date
}
