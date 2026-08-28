import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { documentBatchStatusModel } from './document-batch-status-model'
import { documentChannelModel } from './document-channel-model'

export const documentBatchModel = pgTable(
  'document_batches',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    readableId: text('readable_id').notNull().unique(),
    status: documentBatchStatusModel('status').default('received').notNull(),
    channel: documentChannelModel('channel').notNull(),
    sender: text('sender').notNull(),
    inTriageBox: boolean('in_triage_box').default(false).notNull(),
    clientId: uuid('client_id'),
    intakeId: uuid('intake_id'),
    createdBy: uuid('created_by'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('document_batches_readable_id_uidx').on(table.readableId),
    index('document_batches_status_idx').on(table.status),
    index('document_batches_client_id_idx').on(table.clientId),
    index('document_batches_in_triage_box_idx').on(table.inTriageBox),
  ],
)
