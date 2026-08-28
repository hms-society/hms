import { sql } from 'drizzle-orm'
import type { CommunicationChannel } from '@hms/core/communication/domain/structures'
import {
  check,
  jsonb,
  integer,
  pgTable,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

import { formalizationModel } from '@/formalization/database/drizzle/models/formalization-model'
import { formalizationSignatoryRoleModel } from '@/formalization/database/drizzle/models/formalization-signatory-role-model'

export const formalizationSignatoryModel = pgTable(
  'formalization_signatories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    formalizationId: uuid('formalization_id')
      .notNull()
      .references(() => formalizationModel.id, { onDelete: 'cascade' }),
    personId: uuid('person_id').notNull(),
    role: formalizationSignatoryRoleModel('role').notNull(),
    position: integer('position').notNull(),
    selectedChannels: jsonb('selected_channels')
      .$type<readonly CommunicationChannel[]>()
      .notNull()
      .default([]),
    createdByCollaboratorId: uuid('created_by_collaborator_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedByCollaboratorId: uuid('updated_by_collaborator_id').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('formalization_signatories_owner_position_uq').on(
      table.formalizationId,
      table.position,
    ),
    uniqueIndex('formalization_signatories_owner_person_uq').on(
      table.formalizationId,
      table.personId,
    ),
    uniqueIndex('formalization_signatories_default_client_uq')
      .on(table.formalizationId)
      .where(sql`${table.role} = 'client'`),
    uniqueIndex('formalization_signatories_default_lawyer_uq')
      .on(table.formalizationId)
      .where(sql`${table.role} = 'responsible_lawyer'`),
    unique('formalization_signatories_owner_id_uq').on(table.formalizationId, table.id),
    check('formalization_signatories_positive_position_ck', sql`${table.position} >= 1`),
  ],
)
