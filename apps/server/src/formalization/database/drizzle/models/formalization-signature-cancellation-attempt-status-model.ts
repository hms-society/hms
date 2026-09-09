import { pgEnum } from 'drizzle-orm/pg-core'

export const formalizationSignatureCancellationAttemptStatusModel = pgEnum(
  'formalization_signature_cancellation_attempt_status',
  ['pending', 'processing', 'cancelled', 'failed'],
)
