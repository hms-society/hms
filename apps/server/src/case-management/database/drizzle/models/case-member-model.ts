import { sql } from 'drizzle-orm'
import {
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  boolean,
} from 'drizzle-orm/pg-core'

import { caseMemberRoleModel } from '@/case-management/database/drizzle/models/case-member-role-model'
import { legalCaseModel } from '@/case-management/database/drizzle/models/legal-case-model'

export const caseMemberModel = pgTable(
  'case_members',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    caseId: uuid('case_id')
      .notNull()
      .references(() => legalCaseModel.id, { onDelete: 'cascade' }),
    collaboratorId: uuid('collaborator_id').notNull(),
    role: caseMemberRoleModel('role').notNull(),
    assignedAt: timestamp('assigned_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    assignedBy: uuid('assigned_by').notNull(),
    removedAt: timestamp('removed_at', { withTimezone: true, mode: 'date' }),
    removedBy: uuid('removed_by'),
    archivedLegacy: boolean('archived_legacy').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('case_members_case_collaborator_uidx').on(
      table.caseId,
      table.collaboratorId,
    ),
    index('case_members_case_id_idx').on(table.caseId),
    index('case_members_collaborator_id_idx').on(table.collaboratorId),
    index('case_members_active_case_id_idx')
      .on(table.caseId)
      .where(sql`${table.removedAt} IS NULL AND ${table.archivedLegacy} = false`),
  ],
)
