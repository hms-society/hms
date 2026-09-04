import { signatureBytea } from '@/formalization/database/drizzle/signature-bytea'
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
import { formalizationSignatureAccessStatusModel } from '@/formalization/database/drizzle/models/formalization-signature-access-status-model'
import { formalizationSignatureSessionKindModel } from '@/formalization/database/drizzle/models/formalization-signature-session-kind-model'
import { formalizationSignatureRecipientModel } from '@/formalization/database/drizzle/models/formalization-signature-recipient-model'
import { formalizationSignatureRequestModel } from '@/formalization/database/drizzle/models/formalization-signature-request-model'
import { formalizationSignatureSnapshotModel } from '@/formalization/database/drizzle/models/formalization-signature-snapshot-model'

export const formalizationSignatureGatewaySessionModel = pgTable(
  'formalization_signature_gateway_sessions',
  {
    id: uuid('id').primaryKey(),
    requestId: uuid('request_id').notNull(),
    recipientId: uuid('recipient_id').notNull(),
    snapshotId: uuid('snapshot_id').notNull(),
    kind: formalizationSignatureSessionKindModel('kind').notNull(),
    tokenHash: signatureBytea('token_hash').notNull(),
    deviceSecretHash: signatureBytea('device_secret_hash').notNull(),
    csrfHash: signatureBytea('csrf_hash').notNull(),
    status: formalizationSignatureAccessStatusModel('status').notNull(),
    issuedAt: timestamp('issued_at', { withTimezone: true, mode: 'date' }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true, mode: 'date' }),
    revocationReason: varchar('revocation_reason', { length: 128 }),
    version: integer('version').notNull().default(1),
  },
  (table) => [
    foreignKey({
      columns: [table.requestId],
      foreignColumns: [formalizationSignatureRequestModel.id],
      name: 'fs_sig_gateway_request_fk',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.recipientId],
      foreignColumns: [formalizationSignatureRecipientModel.id],
      name: 'fs_sig_gateway_recipient_fk',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.snapshotId],
      foreignColumns: [formalizationSignatureSnapshotModel.id],
      name: 'fs_sig_gateway_snapshot_fk',
    }).onDelete('restrict'),
    uniqueIndex('formalization_signature_gateway_sessions_token_hash_uq').on(
      table.tokenHash,
    ),
    uniqueIndex('formalization_signature_gateway_sessions_active_device_uq')
      .on(table.recipientId, table.deviceSecretHash)
      .where(sql`${table.status} = 'active' and ${table.kind} = 'authenticated'`),
    index('formalization_signature_gateway_sessions_recipient_status_idx').on(
      table.recipientId,
      table.status,
    ),
    index('formalization_signature_gateway_sessions_expiry_idx').on(
      table.expiresAt,
      table.status,
    ),
    check(
      'formalization_signature_gateway_sessions_hashes_ck',
      sql`octet_length(${table.tokenHash}) = 32 and octet_length(${table.deviceSecretHash}) = 32 and octet_length(${table.csrfHash}) = 32`,
    ),
    check(
      'formalization_signature_gateway_sessions_version_ck',
      sql`${table.version} > 0`,
    ),
  ],
)
