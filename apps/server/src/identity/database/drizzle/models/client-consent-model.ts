import { sql } from 'drizzle-orm'
import { index, pgTable, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

import { clientModel } from '@/identity/database/drizzle/models/client-model'
import { consentTypeModel } from '@/identity/database/drizzle/models/consent-type-model'

export const clientConsentModel = pgTable(
  'client_consents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    clientId: uuid('client_id')
      .notNull()
      .references(() => clientModel.id, { onDelete: 'cascade' }),
    type: consentTypeModel('type').notNull(),
    grantedAt: timestamp('granted_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true, mode: 'date' }),
  },
  (table) => [
    index('client_consents_client_id_idx').on(table.clientId),
    uniqueIndex('client_consents_active_uidx')
      .on(table.clientId, table.type)
      .where(sql`${table.revokedAt} IS NULL`),
  ],
)
