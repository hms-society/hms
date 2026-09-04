import { signatureBytea } from '@/formalization/database/drizzle/signature-bytea'
import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { formalizationSignatureWebhookStatusModel } from '@/formalization/database/drizzle/models/formalization-signature-webhook-status-model'

export const formalizationSignatureWebhookReceiptModel = pgTable(
  'formalization_signature_webhook_receipts',
  {
    id: uuid('id').primaryKey(),
    dedupeKey: signatureBytea('dedupe_key').notNull(),
    hintKind: varchar('hint_kind', { length: 32 }).notNull(),
    encryptedHint: signatureBytea('encrypted_hint').notNull(),
    cipherKeyId: varchar('cipher_key_id', { length: 128 }).notNull(),
    status: formalizationSignatureWebhookStatusModel('status').notNull(),
    receivedAt: timestamp('received_at', { withTimezone: true, mode: 'date' }).notNull(),
    claimToken: varchar('claim_token', { length: 255 }),
    leaseUntil: timestamp('lease_until', { withTimezone: true, mode: 'date' }),
    attempts: integer('attempts').notNull().default(0),
    nextAttemptAt: timestamp('next_attempt_at', { withTimezone: true, mode: 'date' }),
    processedAt: timestamp('processed_at', { withTimezone: true, mode: 'date' }),
  },
  (table) => [
    uniqueIndex('formalization_signature_webhook_receipts_dedupe_uq').on(table.dedupeKey),
    index('formalization_signature_webhook_receipts_work_idx').on(
      table.status,
      table.nextAttemptAt,
    ),
    index('formalization_signature_webhook_receipts_lease_idx').on(table.leaseUntil),
    check(
      'formalization_signature_webhook_receipts_dedupe_ck',
      sql`octet_length(${table.dedupeKey}) = 32`,
    ),
    check(
      'formalization_signature_webhook_receipts_attempts_ck',
      sql`${table.attempts} >= 0`,
    ),
    check(
      'formalization_signature_webhook_receipts_hint_kind_ck',
      sql`${table.hintKind} in ('observation', 'reconciliation_only')`,
    ),
    check(
      'formalization_signature_webhook_receipts_claim_ck',
      sql`(${table.status} = 'processing' and ${table.claimToken} is not null and ${table.leaseUntil} is not null) or (${table.status} <> 'processing' and ${table.claimToken} is null and ${table.leaseUntil} is null)`,
    ),
  ],
)
