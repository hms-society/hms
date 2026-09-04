import { signatureBytea } from '@/formalization/database/drizzle/signature-bytea'
import { sql } from 'drizzle-orm'
import {
  bigint,
  check,
  foreignKey,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { formalizationSignatureArtifactKindModel } from '@/formalization/database/drizzle/models/formalization-signature-artifact-kind-model'
import { formalizationSignatureRequestDocumentModel } from '@/formalization/database/drizzle/models/formalization-signature-request-document-model'
import { formalizationSignatureRequestModel } from '@/formalization/database/drizzle/models/formalization-signature-request-model'

export const formalizationSignatureArtifactModel = pgTable(
  'formalization_signature_artifacts',
  {
    id: uuid('id').primaryKey(),
    requestId: uuid('request_id').notNull(),
    requestDocumentId: uuid('request_document_id'),
    kind: formalizationSignatureArtifactKindModel('kind').notNull(),
    privateFileId: uuid('private_file_id').notNull(),
    sha256: signatureBytea('sha256').notNull(),
    byteCount: bigint('byte_count', { mode: 'number' }).notNull(),
    mediaType: varchar('media_type', { length: 128 }).notNull(),
    providerReference: varchar('provider_reference', { length: 255 }),
    preservedAt: timestamp('preserved_at', {
      withTimezone: true,
      mode: 'date',
    }).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.requestId],
      foreignColumns: [formalizationSignatureRequestModel.id],
      name: 'fs_sig_artifact_request_fk',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.requestDocumentId],
      foreignColumns: [formalizationSignatureRequestDocumentModel.id],
      name: 'fs_sig_artifact_req_doc_fk',
    }).onDelete('restrict'),
    uniqueIndex('formalization_signature_artifacts_document_kind_uq')
      .on(table.requestDocumentId, table.kind)
      .where(sql`${table.requestDocumentId} is not null`),
    uniqueIndex('formalization_signature_artifacts_request_kind_uq')
      .on(table.requestId, table.kind)
      .where(sql`${table.requestDocumentId} is null`),
    check(
      'formalization_signature_artifacts_sha256_ck',
      sql`octet_length(${table.sha256}) = 32`,
    ),
    check('formalization_signature_artifacts_byte_count_ck', sql`${table.byteCount} > 0`),
    check(
      'formalization_signature_artifacts_scope_ck',
      sql`(${table.kind} = 'signed_pdf' and ${table.requestDocumentId} is not null) or (${table.kind} <> 'signed_pdf' and ${table.requestDocumentId} is null)`,
    ),
  ],
)
