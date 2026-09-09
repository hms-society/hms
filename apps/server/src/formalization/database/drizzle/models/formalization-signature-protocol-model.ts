import { signatureBytea } from '@/formalization/database/drizzle/signature-bytea'
import { sql } from 'drizzle-orm'
import {
  check,
  foreignKey,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { formalizationSignatureRecipientModel } from '@/formalization/database/drizzle/models/formalization-signature-recipient-model'
import { formalizationSignatureRequestModel } from '@/formalization/database/drizzle/models/formalization-signature-request-model'

export const formalizationSignatureProtocolModel = pgTable(
  'formalization_signature_protocols',
  {
    id: uuid('id').primaryKey(),
    requestId: uuid('request_id').notNull(),
    recipientId: uuid('recipient_id').notNull(),
    number: varchar('number', { length: 128 }).notNull(),
    artifactSetHash: signatureBytea('artifact_set_hash').notNull(),
    confirmedAt: timestamp('confirmed_at', {
      withTimezone: true,
      mode: 'date',
    }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.requestId],
      foreignColumns: [formalizationSignatureRequestModel.id],
      name: 'fs_sig_protocol_request_fk',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.recipientId],
      foreignColumns: [formalizationSignatureRecipientModel.id],
      name: 'fs_sig_protocol_recipient_fk',
    }).onDelete('restrict'),
    uniqueIndex('formalization_signature_protocols_number_uq').on(table.number),
    uniqueIndex('formalization_signature_protocols_recipient_request_uq').on(
      table.recipientId,
      table.requestId,
    ),
    check(
      'formalization_signature_protocols_hash_ck',
      sql`octet_length(${table.artifactSetHash}) = 32`,
    ),
  ],
)
