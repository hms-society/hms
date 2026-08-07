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
import { clientModel, userModel } from '@/identity/database/drizzle/models'
import { intakeModel } from '@/intake/database/drizzle/models'

export const documentBatchModel = pgTable(
  'document_batches',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    readableId: text('readable_id').notNull().unique(),
    status: documentBatchStatusModel('status').default('received').notNull(),
    channel: documentChannelModel('channel').notNull(),
    sender: text('sender').notNull(),
    inTriageBox: boolean('in_triage_box').default(false).notNull(),
    clientId: uuid('client_id').references(() => clientModel.id, {
      onDelete: 'set null',
    }),
    intakeId: uuid('intake_id').references(() => intakeModel.id, {
      onDelete: 'set null',
    }),
    createdBy: uuid('created_by').references(() => userModel.id, {
      onDelete: 'set null',
    }),
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
