import { signatureBytea } from '@/formalization/database/drizzle/signature-bytea'
import { sql } from 'drizzle-orm'
import {
  check,
  foreignKey,
  timestamp,
  uniqueIndex,
  integer,
  pgTable,
  uuid,
} from 'drizzle-orm/pg-core'
import { formalizationModel } from '@/formalization/database/drizzle/models/formalization-model'

export const formalizationSignatureSnapshotModel = pgTable(
  'formalization_signature_snapshots',
  {
    id: uuid('id').primaryKey(),
    formalizationId: uuid('formalization_id').notNull(),
    formalizationVersion: integer('formalization_version').notNull(),
    signatureConfigurationVersion: integer('signature_configuration_version').notNull(),
    snapshotHash: signatureBytea('snapshot_hash').notNull(),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    uniqueIndex('formalization_signature_snapshots_hash_uq').on(table.snapshotHash),
    uniqueIndex('formalization_signature_snapshots_version_uq').on(
      table.formalizationId,
      table.signatureConfigurationVersion,
    ),
    foreignKey({
      name: 'fs_snapshot_formalization_fk',
      columns: [table.formalizationId],
      foreignColumns: [formalizationModel.id],
    }).onDelete('restrict'),
    check(
      'formalization_signature_snapshots_versions_ck',
      sql`${table.formalizationVersion} > 0 and ${table.signatureConfigurationVersion} > 0`,
    ),
    check(
      'formalization_signature_snapshots_hash_ck',
      sql`octet_length(${table.snapshotHash}) = 32`,
    ),
  ],
)
