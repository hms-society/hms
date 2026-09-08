import { signatureBytea } from '@/formalization/database/drizzle/signature-bytea'
import { sql } from 'drizzle-orm'
import {
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { formalizationSignatureDeliveryStatusModel } from '@/formalization/database/drizzle/models/formalization-signature-delivery-status-model'
import { formalizationSignatureInvitationModel } from '@/formalization/database/drizzle/models/formalization-signature-invitation-model'

export const formalizationSignatureInvitationSendAttemptModel = pgTable(
  'formalization_signature_invitation_send_attempts',
  {
    id: uuid('id').primaryKey(),
    invitationId: uuid('invitation_id').notNull().unique('fs_inv_send_inv_uq'),
    encryptedPayload: signatureBytea('encrypted_payload').notNull(),
    cipherKeyId: varchar('cipher_key_id', { length: 128 }).notNull(),
    status: formalizationSignatureDeliveryStatusModel('status').notNull(),
    communicationMessageId: varchar('communication_message_id', { length: 255 }),
    attempts: integer('attempts').notNull().default(0),
    nextAttemptAt: timestamp('next_attempt_at', { withTimezone: true, mode: 'date' }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    index('formalization_signature_invitation_send_attempts_work_idx').on(
      table.status,
      table.nextAttemptAt,
    ),
    foreignKey({
      name: 'fs_inv_send_inv_fk',
      columns: [table.invitationId],
      foreignColumns: [formalizationSignatureInvitationModel.id],
    }).onDelete('restrict'),
    check(
      'formalization_signature_invitation_send_attempts_attempts_ck',
      sql`${table.attempts} >= 0`,
    ),
  ],
)
