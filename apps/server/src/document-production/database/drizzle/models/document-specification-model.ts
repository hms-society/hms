import { sql } from 'drizzle-orm'
import type { DocumentTemplateContent } from '@hms/core/document-production/domain/structures'
import { check, index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const documentSpecificationModel = pgTable(
  'document_specifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    content: jsonb('content').$type<DocumentTemplateContent>().notNull(),
    variables: jsonb('variables').$type<unknown[]>().notNull().default([]),
    moment: text('moment').notNull(),
    scope: text('scope').notNull(),
    status: text('status').notNull().default('available'),
    accessClassification: text('access_classification').notNull().default('Interno'),

    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  
  (table) => [
    check(
      'document_specifications_moment_check',
      sql`${table.moment} in ('consultation', 'formalization', 'legal_production')`,
    ),
    check(
      'document_specifications_scope_check',
      sql`${table.scope} in ('global', 'legal_context')`,
    ),
    check(
      'document_specifications_status_check',
      sql`${table.status} in ('available', 'unavailable')`,
    ),
    
    check(
      'document_specifications_access_classification_check',
      sql`${table.accessClassification} in ('Interno', 'Cliente', 'Restrito', 'Confidencial', 'Parceiro liberado')`,
    ),

    check(
      'document_specifications_variables_check',
      sql`jsonb_typeof(${table.variables}) = 'array'`,
    ),
    check(
      'document_specifications_content_check',
      sql`jsonb_typeof(${table.content}) = 'object' AND ${table.content}->>'type' = 'doc' AND (${table.content}->'content' IS NULL OR jsonb_typeof(${table.content}->'content') = 'array')`,
    ),
    index('document_specifications_name_normalized_idx').on(
      sql`lower(trim(${table.name}))`,
    ),
    index('document_specifications_moment_idx').on(table.moment),
    index('document_specifications_status_idx').on(table.status),
  ],
)
export const documentSpecificationAuditLogModel = pgTable(
  'document_specifications_audit_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    documentSpecificationId: uuid('document_specification_id')
      .notNull()
      .references(() => documentSpecificationModel.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull(), 
    action: text('action').notNull(), 
    previousValue: text('previous_value'), 
    newValue: text('new_value'), 
    receptor: text('receptor'), 
    
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  }
)

export const externalAccessLogModel = pgTable(
  'external_access_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    documentSpecificationId: uuid('document_specification_id')
      .notNull()
      .references(() => documentSpecificationModel.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull(),
    denialReason: text('denial_reason').notNull(), 
    
    attemptedAt: timestamp('attempted_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  }
)