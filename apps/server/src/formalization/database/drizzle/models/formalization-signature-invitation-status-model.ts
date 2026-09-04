import { pgEnum } from 'drizzle-orm/pg-core'

export const formalizationSignatureInvitationStatusModel = pgEnum(
  'formalization_signature_invitation_status',
  ['active', 'consumed', 'revoked', 'expired'],
)
