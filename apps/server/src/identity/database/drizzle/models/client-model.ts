import { sql } from 'drizzle-orm'
import {
  check,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

import { clientTypeModel } from '@/identity/database/drizzle/models/client-type-model'
import { taxIdTypeModel } from '@/identity/database/drizzle/models/tax-id-type-model'

export const clientModel = pgTable(
  'clients',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    type: clientTypeModel('type').notNull(),
    name: text('name'),
    legalName: text('legal_name'),
    tradeName: text('trade_name'),
    taxIdType: taxIdTypeModel('tax_id_type').notNull(),
    taxIdValue: text('tax_id_value').notNull(),
    phone: text('phone'),
    email: text('email'),
    street: text('street'),
    number: text('number'),
    complement: text('complement'),
    district: text('district'),
    city: text('city'),
    state: text('state'),
    zipCode: text('zip_code'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('clients_tax_id_uidx').on(table.taxIdType, table.taxIdValue),
    index('clients_phone_idx').on(table.phone),
    check(
      'clients_identity_fields_check',
      sql`(("type" = 'natural' AND "name" IS NOT NULL AND "legal_name" IS NULL AND "tax_id_type" = 'cpf') OR ("type" = 'legal' AND "name" IS NULL AND "legal_name" IS NOT NULL AND "tax_id_type" = 'cnpj'))`,
    ),
    check(
      'clients_address_fields_check',
      sql`(("street" IS NULL AND "number" IS NULL AND "district" IS NULL AND "city" IS NULL AND "state" IS NULL AND "zip_code" IS NULL) OR ("street" IS NOT NULL AND "number" IS NOT NULL AND "district" IS NOT NULL AND "city" IS NOT NULL AND "state" IS NOT NULL AND "zip_code" IS NOT NULL))`,
    ),
  ],
)
