import { signatureBytea } from '@/formalization/database/drizzle/signature-bytea'
import { sql } from 'drizzle-orm'
import {
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  smallint,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { formalizationSignatureInvitationModel } from '@/formalization/database/drizzle/models/formalization-signature-invitation-model'
import { formalizationSignatureOtpChallengeStatusModel } from '@/formalization/database/drizzle/models/formalization-signature-otp-challenge-status-model'

export const formalizationSignatureOtpChallengeModel = pgTable(
  'formalization_signature_otp_challenges',
  {
    id: uuid('id').primaryKey(),
    invitationId: uuid('invitation_id').notNull(),
    generation: integer('generation').notNull(),
    codeMac: signatureBytea('code_mac').notNull(),
    channelChoiceId: uuid('channel_choice_id').notNull(),
    destinationFingerprint: signatureBytea('destination_fingerprint').notNull(),
    status: formalizationSignatureOtpChallengeStatusModel('status').notNull(),
    failedAttempts: smallint('failed_attempts').notNull().default(0),
    issuedAt: timestamp('issued_at', { withTimezone: true, mode: 'date' }).notNull(),
    sentAt: timestamp('sent_at', { withTimezone: true, mode: 'date' }),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }),
    consumedAt: timestamp('consumed_at', { withTimezone: true, mode: 'date' }),
  },
  (table) => [
    uniqueIndex('formalization_signature_otp_challenges_invitation_generation_uq').on(
      table.invitationId,
      table.generation,
    ),
    foreignKey({
      name: 'fs_otp_challenge_inv_fk',
      columns: [table.invitationId],
      foreignColumns: [formalizationSignatureInvitationModel.id],
    }).onDelete('cascade'),
    uniqueIndex('formalization_signature_otp_challenges_current_invitation_uq')
      .on(table.invitationId)
      .where(sql`${table.status} in ('pending_delivery','active')`),
    index('formalization_signature_otp_challenges_invitation_status_idx').on(
      table.invitationId,
      table.status,
    ),
    check(
      'formalization_signature_otp_challenges_generation_ck',
      sql`${table.generation} > 0`,
    ),
    check(
      'formalization_signature_otp_challenges_code_mac_ck',
      sql`octet_length(${table.codeMac}) = 32`,
    ),
    check(
      'formalization_signature_otp_challenges_destination_ck',
      sql`octet_length(${table.destinationFingerprint}) = 32`,
    ),
    check(
      'formalization_signature_otp_challenges_failed_attempts_ck',
      sql`${table.failedAttempts} between 0 and 5`,
    ),
  ],
)
