import { sql } from 'drizzle-orm'
import {
  check,
  foreignKey,
  integer,
  pgTable,
  smallint,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { formalizationSignatureInvitationModel } from '@/formalization/database/drizzle/models/formalization-signature-invitation-model'

export const formalizationSignatureOtpGuardModel = pgTable(
  'formalization_signature_otp_guards',
  {
    invitationId: uuid('invitation_id').primaryKey(),
    failedAttempts: smallint('failed_attempts').notNull().default(0),
    rollingWindowStartedAt: timestamp('rolling_window_started_at', {
      withTimezone: true,
      mode: 'date',
    }).notNull(),
    sendsInWindow: smallint('sends_in_window').notNull().default(0),
    lastSentAt: timestamp('last_sent_at', { withTimezone: true, mode: 'date' }),
    lockedUntil: timestamp('locked_until', { withTimezone: true, mode: 'date' }),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
    version: integer('version').notNull().default(1),
  },
  (table) => [
    foreignKey({
      name: 'fs_otp_guard_inv_fk',
      columns: [table.invitationId],
      foreignColumns: [formalizationSignatureInvitationModel.id],
    }).onDelete('cascade'),
    check(
      'formalization_signature_otp_guards_failed_attempts_ck',
      sql`${table.failedAttempts} between 0 and 5`,
    ),
    check(
      'formalization_signature_otp_guards_sends_ck',
      sql`${table.sendsInWindow} >= 0`,
    ),
    check('formalization_signature_otp_guards_version_ck', sql`${table.version} > 0`),
  ],
)
