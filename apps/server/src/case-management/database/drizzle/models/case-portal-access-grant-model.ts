import { boolean, index, pgTable, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

import { casePortalAccessGrantStatusModel } from './case-portal-access-grant-status-model'
import { legalCaseModel } from './legal-case-model'
import { userModel } from '@/identity/database/drizzle/models/user-model'

export const casePortalAccessGrantModel = pgTable(
  'case_portal_access_grants',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    caseId: uuid('case_id')
      .notNull()
      .references(() => legalCaseModel.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => userModel.id, { onDelete: 'cascade' }),
    canView: boolean('can_view').default(false).notNull(),
    canUpload: boolean('can_upload').default(false).notNull(),
    status: casePortalAccessGrantStatusModel('status').default('active').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }),
    grantedBy: uuid('granted_by').notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('case_portal_access_grants_case_user_uidx').on(table.caseId, table.userId),
    index('case_portal_access_grants_user_status_idx').on(table.userId, table.status),
  ],
)
