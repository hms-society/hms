import {
  check,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

import { collaboratorModel } from '@/identity/database/drizzle/models/collaborator-model'
import { thirdPartyDocumentTypeModel } from '@/identity/database/drizzle/models/third-party-document-type-model'
import { thirdPartyStatusModel } from '@/identity/database/drizzle/models/third-party-status-model'
import { thirdPartyTypeModel } from '@/identity/database/drizzle/models/third-party-type-model'

export const thirdPartyModel = pgTable(
  'third_parties',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    type: thirdPartyTypeModel('type').notNull(),
    legalName: text('legal_name').notNull(),
    tradeName: text('trade_name'),
    taxIdType: thirdPartyDocumentTypeModel('document_type').notNull(),
    taxIdValue: text('tax_id_value').notNull(),
    taxIdDescription: text('tax_id_description'),
    internalResponsibleId: uuid('internal_responsible_id')
      .notNull()
      .references(() => collaboratorModel.id),
    relationshipTypes: jsonb('relationship_types').$type<string[]>().notNull(),
    status: thirdPartyStatusModel('status').default('active').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('third_parties_tax_id_uidx').on(table.taxIdType, table.taxIdValue),
    index('third_parties_status_idx').on(table.status),
    index('third_parties_responsible_idx').on(table.internalResponsibleId),
    check(
      'third_parties_relationship_types_check',
      sql`jsonb_typeof(${table.relationshipTypes}) = 'array' AND jsonb_array_length(${table.relationshipTypes}) > 0`,
    ),
  ],
)
