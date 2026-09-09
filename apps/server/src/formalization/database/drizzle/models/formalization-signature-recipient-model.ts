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
import { formalizationSignatoryModel } from '@/formalization/database/drizzle/models/formalization-signatory-model'
import { signatureBytea } from '@/formalization/database/drizzle/signature-bytea'
import { formalizationSignatureRequestModel } from '@/formalization/database/drizzle/models/formalization-signature-request-model'
import { formalizationSignatureRecipientKindModel } from '@/formalization/database/drizzle/models/formalization-signature-recipient-kind-model'
import { formalizationSignatureRecipientStatusModel } from '@/formalization/database/drizzle/models/formalization-signature-recipient-status-model'

export const formalizationSignatureRecipientModel = pgTable(
  'formalization_signature_recipients',
  {
    id: uuid('id').primaryKey(),
    requestId: uuid('request_id').notNull(),
    signatoryId: uuid('signatory_id').notNull(),
    personId: uuid('person_id').notNull(),
    actorKind: formalizationSignatureRecipientKindModel('actor_kind').notNull(),
    displayNameSnapshot: varchar('display_name_snapshot', { length: 255 }).notNull(),
    deliveryChannel: varchar('delivery_channel', { length: 32 }).notNull(),
    status: formalizationSignatureRecipientStatusModel('status').notNull(),
    submissionObservationId: signatureBytea('submission_observation_id'),
    version: integer('version').notNull().default(1),
    invitedAt: timestamp('invited_at', { withTimezone: true, mode: 'date' }),
    submittedAt: timestamp('submitted_at', { withTimezone: true, mode: 'date' }),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true, mode: 'date' }),
    terminalAt: timestamp('terminal_at', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    uniqueIndex('formalization_signature_recipients_request_signatory_uq').on(
      table.requestId,
      table.signatoryId,
    ),
    uniqueIndex('formalization_signature_recipients_request_id_uq').on(
      table.requestId,
      table.id,
    ),
    uniqueIndex('formalization_signature_recipients_submission_observation_uq')
      .on(table.submissionObservationId)
      .where(sql`${table.submissionObservationId} is not null`),
    foreignKey({
      name: 'fs_recipient_req_fk',
      columns: [table.requestId],
      foreignColumns: [formalizationSignatureRequestModel.id],
    }).onDelete('restrict'),
    foreignKey({
      name: 'fs_recipient_signatory_fk',
      columns: [table.signatoryId],
      foreignColumns: [formalizationSignatoryModel.id],
    }).onDelete('restrict'),
    index('formalization_signature_recipients_request_status_idx').on(
      table.requestId,
      table.status,
    ),
    index('formalization_signature_recipients_person_status_idx').on(
      table.personId,
      table.status,
    ),
    check(
      'formalization_signature_recipients_channel_ck',
      sql`${table.deliveryChannel} = 'email'`,
    ),
    check('formalization_signature_recipients_version_ck', sql`${table.version} > 0`),
    check(
      'formalization_signature_recipients_submission_observation_ck',
      sql`${table.submissionObservationId} is null or octet_length(${table.submissionObservationId}) = 32`,
    ),
  ],
)
