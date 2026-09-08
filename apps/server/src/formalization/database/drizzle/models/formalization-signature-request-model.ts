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
} from 'drizzle-orm/pg-core'
import { formalizationModel } from '@/formalization/database/drizzle/models/formalization-model'
import { formalizationSignatureSnapshotModel } from '@/formalization/database/drizzle/models/formalization-signature-snapshot-model'
import { formalizationSignatureRequestStatusModel } from '@/formalization/database/drizzle/models/formalization-signature-request-status-model'

export const formalizationSignatureRequestModel = pgTable(
  'formalization_signature_requests',
  {
    id: uuid('id').primaryKey(),
    formalizationId: uuid('formalization_id').notNull(),
    signatureConfigurationVersion: integer('signature_configuration_version').notNull(),
    snapshotId: uuid('snapshot_id').notNull().unique('fs_req_snapshot_uq'),
    confirmationKeyHash: signatureBytea('confirmation_key_hash').notNull(),
    status: formalizationSignatureRequestStatusModel('status').notNull(),
    version: integer('version').notNull().default(1),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
    sentAt: timestamp('sent_at', { withTimezone: true, mode: 'date' }),
    submittedAt: timestamp('submitted_at', { withTimezone: true, mode: 'date' }),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true, mode: 'date' }),
    terminalAt: timestamp('terminal_at', { withTimezone: true, mode: 'date' }),
    cancellationRequestedAt: timestamp('cancellation_requested_at', {
      withTimezone: true,
      mode: 'date',
    }),
  },
  (table) => [
    uniqueIndex('formalization_signature_requests_confirmation_key_uq').on(
      table.confirmationKeyHash,
    ),
    foreignKey({
      name: 'fs_req_formalization_fk',
      columns: [table.formalizationId],
      foreignColumns: [formalizationModel.id],
    }).onDelete('restrict'),
    foreignKey({
      name: 'fs_req_snapshot_fk',
      columns: [table.snapshotId],
      foreignColumns: [formalizationSignatureSnapshotModel.id],
    }).onDelete('restrict'),
    uniqueIndex('formalization_signature_requests_formalization_version_uq').on(
      table.formalizationId,
      table.signatureConfigurationVersion,
    ),
    uniqueIndex('formalization_signature_requests_current_formalization_uq')
      .on(table.formalizationId)
      .where(
        sql`${table.status} not in ('confirmed','rejected','cancelled','expired','failed')`,
      ),
    index('formalization_signature_requests_status_idx').on(
      table.status,
      table.updatedAt,
    ),
    check(
      'formalization_signature_requests_versions_ck',
      sql`${table.signatureConfigurationVersion} > 0 and ${table.version} > 0`,
    ),
    check(
      'formalization_signature_requests_confirmation_key_ck',
      sql`octet_length(${table.confirmationKeyHash}) = 32`,
    ),
  ],
)
