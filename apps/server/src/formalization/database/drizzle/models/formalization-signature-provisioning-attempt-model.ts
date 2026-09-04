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
import { formalizationSignatureProvisioningAttemptStatusModel } from '@/formalization/database/drizzle/models/formalization-signature-provisioning-attempt-status-model'
import { formalizationSignatureRequestModel } from '@/formalization/database/drizzle/models/formalization-signature-request-model'

export const formalizationSignatureProvisioningAttemptModel = pgTable(
  'formalization_signature_provisioning_attempts',
  {
    id: uuid('id').primaryKey(),
    requestId: uuid('request_id').notNull(),
    attemptToken: uuid('attempt_token').notNull(),
    status: formalizationSignatureProvisioningAttemptStatusModel('status').notNull(),
    attempts: integer('attempts').notNull().default(0),
    leaseExpiresAt: timestamp('lease_expires_at', { withTimezone: true, mode: 'date' }),
    nextAttemptAt: timestamp('next_attempt_at', { withTimezone: true, mode: 'date' }),
    lastFailureCode: varchar('last_failure_code', { length: 128 }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.requestId],
      foreignColumns: [formalizationSignatureRequestModel.id],
      name: 'fs_sig_prov_attempt_request_fk',
    }).onDelete('restrict'),
    uniqueIndex('fs_sig_prov_attempt_request_uq').on(table.requestId),
    index('formalization_signature_provisioning_attempts_work_idx').on(
      table.status,
      table.nextAttemptAt,
    ),
    index('formalization_signature_provisioning_attempts_lease_idx').on(
      table.leaseExpiresAt,
    ),
    check(
      'formalization_signature_provisioning_attempts_attempts_ck',
      sql`${table.attempts} >= 0`,
    ),
  ],
)
