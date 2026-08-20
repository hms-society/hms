import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { intakeClosureReasonModel } from '@/intake/database/drizzle/models/intake-closure-reason-model'
import { intakeContactChannelModel } from '@/intake/database/drizzle/models/intake-contact-channel-model'
import { intakeOriginModel } from '@/intake/database/drizzle/models/intake-origin-model'
import { intakeStatusModel } from '@/intake/database/drizzle/models/intake-status-model'
import { intakeUrgencyModel } from '@/intake/database/drizzle/models/intake-urgency-model'

export const intakeModel = pgTable(
  'intakes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sequenceNumber: serial('sequence_number').notNull(),
    clientId: uuid('client_id').notNull(),
    responsibleId: uuid('responsible_id').notNull(),
    createdBy: uuid('created_by').notNull(),
    updatedBy: uuid('updated_by').notNull(),
    origin: intakeOriginModel('origin').notNull(),
    contactChannel: intakeContactChannelModel('contact_channel').notNull(),
    legalAreaId: uuid('legal_area_id'),
    legalTopicId: uuid('legal_topic_id'),
    urgency: intakeUrgencyModel('urgency').default('normal').notNull(),
    demandNotes: text('demand_notes'),
    status: intakeStatusModel('status').notNull(),
    closureReason: intakeClosureReasonModel('closure_reason'),
    closureNotes: text('closure_notes'),
    closedAt: timestamp('closed_at', { withTimezone: true, mode: 'date' }),
    version: integer('version').default(1).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('intakes_sequence_number_uidx').on(table.sequenceNumber),
    index('intakes_client_created_at_idx').on(table.clientId, table.createdAt),
    index('intakes_status_updated_at_idx').on(table.status, table.updatedAt),
    index('intakes_responsible_status_idx').on(table.responsibleId, table.status),
    check('intakes_version_positive_check', sql`${table.version} > 0`),
    check(
      'intakes_updated_after_created_check',
      sql`${table.updatedAt} >= ${table.createdAt}`,
    ),
    check(
      'intakes_closure_fields_check',
      sql`(
        (
          ${table.status} = 'closed_without_contract'
          AND ${table.closureReason} IS NOT NULL
          AND ${table.closedAt} IS NOT NULL
        )
        OR
        (
          ${table.status} <> 'closed_without_contract'
          AND ${table.closureReason} IS NULL
          AND ${table.closureNotes} IS NULL
          AND ${table.closedAt} IS NULL
        )
      )`,
    ),
  ],
)
