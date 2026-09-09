import { pgEnum } from 'drizzle-orm/pg-core'

export const formalizationSignatureOtpChallengeStatusModel = pgEnum(
  'formalization_signature_otp_challenge_status',
  ['pending_delivery', 'active', 'consumed', 'superseded', 'expired', 'delivery_failed'],
)
