import { pgEnum } from 'drizzle-orm/pg-core'

export const formalizationSignatureProvisioningAttemptStatusModel = pgEnum(
  'formalization_signature_provisioning_attempt_status',
  ['pending', 'processing', 'provisioned', 'reconciliation_required', 'failed'],
)
