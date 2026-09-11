import { sql } from 'drizzle-orm'
import {
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { formalizationSignatureCancellationAttemptStatusModel } from '@/formalization/database/drizzle/models/formalization-signature-cancellation-attempt-status-model'
import { formalizationSignatureRequestModel } from '@/formalization/database/drizzle/models/formalization-signature-request-model'

export const formalizationSignatureCancellationAttemptModel = pgTable(
  'formalization_signature_cancellation_attempts',
  {
    id: uuid('id').primaryKey(),
    requestId: uuid('request_id').notNull(),
    attemptToken: uuid('attempt_token').notNull(),
    status: formalizationSignatureCancellationAttemptStatusModel('status').notNull(),
    attempts: integer('attempts').notNull().default(0),
    requestedBy: uuid('requested_by').notNull(),
    requestedAt: timestamp('requested_at', {
      withTimezone: true,
      mode: 'date',
    }).notNull(),
    leaseExpiresAt: timestamp('lease_expires_at', { withTimezone: true, mode: 'date' }),
    nextAttemptAt: timestamp('next_attempt_at', { withTimezone: true, mode: 'date' }),
    lastFailureCode: varchar('last_failure_code', { length: 128 }),
    reason: varchar('reason', { length: 500 }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.requestId],
      foreignColumns: [formalizationSignatureRequestModel.id],
      name: 'fs_sig_cancel_attempt_request_fk',
    }).onDelete('restrict'),
    uniqueIndex('fs_sig_cancel_attempt_request_uq').on(table.requestId),
    index('formalization_signature_cancellation_attempts_work_idx').on(
      table.status,
      table.nextAttemptAt,
    ),
    index('formalization_signature_cancellation_attempts_lease_idx').on(
      table.leaseExpiresAt,
    ),
    check(
      'formalization_signature_cancellation_attempts_attempts_ck',
      sql`${table.attempts} >= 0`,
    ),
    check(
      'formalization_signature_cancellation_attempts_reason_ck',
      sql`char_length(btrim(${table.reason})) between 1 and 500`,
    ),
  ],
)
