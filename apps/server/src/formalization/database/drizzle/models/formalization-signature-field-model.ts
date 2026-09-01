import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  numeric,
  pgTable,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

import { formalizationModel } from '@/formalization/database/drizzle/models/formalization-model'
import { formalizationSignatoryDocumentModel } from '@/formalization/database/drizzle/models/formalization-signatory-document-model'
import { formalizationSignatureFieldTypeModel } from '@/formalization/database/drizzle/models/formalization-signature-field-type-model'
import { formalizationSignaturePreviewModel } from '@/formalization/database/drizzle/models/formalization-signature-preview-model'

export const formalizationSignatureFieldModel = pgTable(
  'formalization_signature_fields',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    formalizationId: uuid('formalization_id')
      .notNull()
      .references(() => formalizationModel.id, { onDelete: 'cascade' }),
    signatoryDocumentId: uuid('signatory_document_id')
      .notNull()
      .references(() => formalizationSignatoryDocumentModel.id, { onDelete: 'cascade' }),
    previewId: uuid('preview_id')
      .notNull()
      .references(() => formalizationSignaturePreviewModel.id, { onDelete: 'cascade' }),
    type: formalizationSignatureFieldTypeModel('type').notNull().default('signature'),
    page: integer('page').notNull(),
    positionX: numeric('position_x', {
      precision: 7,
      scale: 4,
      mode: 'number',
    }).notNull(),
    positionY: numeric('position_y', {
      precision: 7,
      scale: 4,
      mode: 'number',
    }).notNull(),
    width: numeric('width', { precision: 7, scale: 4, mode: 'number' }).notNull(),
    height: numeric('height', { precision: 7, scale: 4, mode: 'number' }).notNull(),
    createdByCollaboratorId: uuid('created_by_collaborator_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedByCollaboratorId: uuid('updated_by_collaborator_id').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('formalization_signature_fields_assignment_idx').on(
      table.signatoryDocumentId,
      table.previewId,
    ),
    check(
      'formalization_signature_fields_geometry_ck',
      sql`${table.page} >= 1 and ${table.positionX} >= 0 and ${table.positionY} >= 0 and ${table.width} > 0 and ${table.height} > 0 and ${table.positionX} + ${table.width} <= 100 and ${table.positionY} + ${table.height} <= 100`,
    ),
  ],
)
