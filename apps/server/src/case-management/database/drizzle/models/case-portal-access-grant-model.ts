import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

import { casePortalAccessGrantStatusModel } from './case-portal-access-grant-status-model'
import { legalCaseModel } from './legal-case-model'

export const casePortalAccessGrantModel = pgTable(
  'case_portal_access_grants',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    caseId: uuid('case_id')
      .notNull()
      .references(() => legalCaseModel.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
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
    uniqueIndex('case_portal_access_grants_token_hash_uidx').on(table.tokenHash),
    index('case_portal_access_grants_case_status_idx').on(table.caseId, table.status),
  ],
)
