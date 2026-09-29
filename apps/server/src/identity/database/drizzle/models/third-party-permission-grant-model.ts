import {
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  boolean,
} from 'drizzle-orm/pg-core'

import { thirdPartyModel } from '@/identity/database/drizzle/models/third-party-model'
import { thirdPartyPermissionModel } from '@/identity/database/drizzle/models/third-party-permission-model'
import { userModel } from '@/identity/database/drizzle/models/user-model'

export const thirdPartyPermissionGrantModel = pgTable(
  'third_party_permission_grants',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    thirdPartyId: uuid('third_party_id')
      .notNull()
      .references(() => thirdPartyModel.id, { onDelete: 'cascade' }),
    permission: thirdPartyPermissionModel('permission').notNull(),
    active: boolean('active').default(false).notNull(),
    grantedBy: uuid('granted_by')
      .notNull()
      .references(() => userModel.id),
    grantedAt: timestamp('granted_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true, mode: 'date' }),
  },
  (table) => [
    uniqueIndex('third_party_permission_grants_party_permission_uidx').on(
      table.thirdPartyId,
      table.permission,
    ),
    index('third_party_permission_grants_party_active_idx').on(
      table.thirdPartyId,
      table.active,
    ),
  ],
)
