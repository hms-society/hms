import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { userModel } from '@/identity/database/drizzle/models/user-model'

export const wabaAccountStatusEnum = pgEnum('waba_account_status', [
  'active',
  'disabled',
])

export const whatsappChannelQualityEnum = pgEnum('whatsapp_channel_quality', [
  'GREEN',
  'YELLOW',
  'RED',
  'UNKNOWN',
])

export const whatsappChannelStatusEnum = pgEnum('whatsapp_channel_status', [
  'active',
  'disabled',
])

export const wabaAccountsModel = pgTable('waba_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  wabaId: text('waba_id').notNull(),
  name: text('name').notNull(),
  accessToken: text('access_token').notNull(),
  status: wabaAccountStatusEnum('status').default('active').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
})

export const whatsappChannelsModel = pgTable('whatsapp_channels', {
  id: uuid('id').defaultRandom().primaryKey(),
  wabaAccountId: uuid('waba_account_id')
    .notNull()
    .references(() => wabaAccountsModel.id, { onDelete: 'cascade' }),
  phoneNumberId: text('phone_number_id').notNull(),
  displayPhoneNumber: text('display_phone_number').notNull(),
  verifiedName: text('verified_name').notNull(),
  qualityRating: whatsappChannelQualityEnum('quality_rating')
    .default('UNKNOWN')
    .notNull(),
  assignedLawyerId: uuid('assigned_lawyer_id')
    .notNull()
    .references(() => userModel.id, { onDelete: 'cascade' }),
  status: whatsappChannelStatusEnum('status').default('active').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
})
