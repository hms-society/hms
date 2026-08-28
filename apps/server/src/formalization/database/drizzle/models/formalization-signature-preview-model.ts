import { sql } from 'drizzle-orm'
import {
  bigint,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

import type { FormalizationSignaturePreview } from '@hms/core/formalization/domain/entities'
import { formalizationModel } from '@/formalization/database/drizzle/models/formalization-model'
import { storedFileModel } from '@/shared/database/drizzle/models/stored-file-model'
import { formalizationSignaturePreviewStateModel } from '@/formalization/database/drizzle/models/formalization-signature-preview-state-model'

type PreviewPage = FormalizationSignaturePreview['pages'][number]

export const formalizationSignaturePreviewModel = pgTable(
  'formalization_signature_previews',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    formalizationId: uuid('formalization_id')
      .notNull()
      .references(() => formalizationModel.id, { onDelete: 'cascade' }),
    documentId: uuid('document_id').notNull(),
    documentVersionId: uuid('document_version_id').notNull(),
    fileId: uuid('file_id').references(() => storedFileModel.id, {
      onDelete: 'restrict',
    }),
    contentChecksumSha256: varchar('content_checksum_sha256', { length: 64 }),
    pdfChecksumSha256: varchar('pdf_checksum_sha256', { length: 64 }),
    converterVersion: varchar('converter_version', { length: 64 }),
    pageCount: integer('page_count'),
    pages: jsonb('pages').$type<ReadonlyArray<PreviewPage>>().notNull().default([]),
    byteSize: bigint('byte_size', { mode: 'number' }),
    state: formalizationSignaturePreviewStateModel('state').notNull().default('pending'),
    attemptsCount: integer('attempts_count').notNull().default(0),
    attemptToken: uuid('attempt_token'),
    processingStartedAt: timestamp('processing_started_at', {
      withTimezone: true,
      mode: 'date',
    }),
    leaseExpiresAt: timestamp('lease_expires_at', { withTimezone: true, mode: 'date' }),
    failureCode: varchar('failure_code', { length: 64 }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('formalization_signature_previews_current_key_uq')
      .on(table.formalizationId, table.documentId, table.documentVersionId)
      .where(sql`${table.state} in ('pending', 'processing', 'ready', 'failed')`),
    index('formalization_signature_previews_work_idx').on(
      table.state,
      table.leaseExpiresAt,
    ),
    index('formalization_signature_previews_cleanup_idx').on(
      table.state,
      table.updatedAt,
    ),
    check(
      'formalization_signature_previews_attempts_count_ck',
      sql`${table.attemptsCount} >= 0`,
    ),
    check(
      'formalization_signature_previews_lifecycle_ck',
      sql`(
        (${table.state} = 'pending' and ${table.attemptToken} is not null and ${table.fileId} is null and ${table.processingStartedAt} is null and ${table.leaseExpiresAt} is null)
        or
        (${table.state} = 'processing' and ${table.attemptToken} is not null and ${table.processingStartedAt} is not null and ${table.leaseExpiresAt} is not null and ${table.fileId} is null)
        or
        (${table.state} = 'failed' and ${table.failureCode} is not null and ${table.fileId} is null and ${table.processingStartedAt} is null and ${table.leaseExpiresAt} is null)
        or
        (${table.state} in ('ready', 'stale', 'cleanup_pending') and ${table.fileId} is not null and ${table.contentChecksumSha256} is not null and ${table.pdfChecksumSha256} is not null and ${table.converterVersion} is not null and ${table.pageCount} is not null and ${table.pageCount} >= 1 and ${table.byteSize} is not null and ${table.byteSize} > 0 and ${table.attemptToken} is null and ${table.processingStartedAt} is null and ${table.leaseExpiresAt} is null)
      )`,
    ),
  ],
)
