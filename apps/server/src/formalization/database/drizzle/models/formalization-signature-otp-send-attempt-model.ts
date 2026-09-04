import { signatureBytea } from '@/formalization/database/drizzle/signature-bytea'
import { sql } from 'drizzle-orm'
import {
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { formalizationSignatureOtpChallengeModel } from '@/formalization/database/drizzle/models/formalization-signature-otp-challenge-model'
import { formalizationSignatureDeliveryStatusModel } from '@/formalization/database/drizzle/models/formalization-signature-delivery-status-model'

export const formalizationSignatureOtpSendAttemptModel = pgTable(
  'formalization_signature_otp_send_attempts',
  {
    id: uuid('id').primaryKey(),
    challengeId: uuid('challenge_id').notNull().unique('fs_otp_send_challenge_uq'),
    encryptedPayload: signatureBytea('encrypted_payload').notNull(),
    cipherKeyId: varchar('cipher_key_id', { length: 128 }).notNull(),
    status: formalizationSignatureDeliveryStatusModel('status').notNull(),
    providerMessageId: varchar('provider_message_id', { length: 255 }),
    attempts: integer('attempts').notNull().default(0),
    nextAttemptAt: timestamp('next_attempt_at', { withTimezone: true, mode: 'date' }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    index('formalization_signature_otp_send_attempts_work_idx').on(
      table.status,
      table.nextAttemptAt,
    ),
    foreignKey({
      name: 'fs_otp_send_challenge_fk',
      columns: [table.challengeId],
      foreignColumns: [formalizationSignatureOtpChallengeModel.id],
    }).onDelete('cascade'),
    check(
      'formalization_signature_otp_send_attempts_attempts_ck',
      sql`${table.attempts} >= 0`,
    ),
  ],
)
