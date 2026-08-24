import { sql } from 'drizzle-orm'
import {
  boolean,
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
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
    isPrimary: boolean('is_primary').default(false).notNull(),
    assignedAt: timestamp('assigned_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    assignedBy: uuid('assigned_by').notNull(),
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
    uniqueIndex('case_members_one_primary_per_case_uidx')
      .on(table.caseId)
      .where(sql`${table.isPrimary} = true`),
  ],
)
