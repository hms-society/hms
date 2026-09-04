import { signatureBytea } from '@/formalization/database/drizzle/signature-bytea'
import { sql } from 'drizzle-orm'
import {
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { formalizationSignatureRecipientModel } from '@/formalization/database/drizzle/models/formalization-signature-recipient-model'
import { formalizationSignatureRequestModel } from '@/formalization/database/drizzle/models/formalization-signature-request-model'
import { formalizationSignatureDeliveryStatusModel } from '@/formalization/database/drizzle/models/formalization-signature-delivery-status-model'
import { formalizationSignatureInvitationStatusModel } from '@/formalization/database/drizzle/models/formalization-signature-invitation-status-model'

export const formalizationSignatureInvitationModel = pgTable(
  'formalization_signature_invitations',
  {
    id: uuid('id').primaryKey(),
    requestId: uuid('request_id').notNull(),
    recipientId: uuid('recipient_id').notNull(),
    generation: integer('generation').notNull(),
    tokenHash: signatureBytea('token_hash').notNull(),
    status: formalizationSignatureInvitationStatusModel('status').notNull(),
    deliveryStatus:
      formalizationSignatureDeliveryStatusModel('delivery_status').notNull(),
    communicationMessageId: varchar('communication_message_id', { length: 255 }),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
    deliveredAt: timestamp('delivered_at', { withTimezone: true, mode: 'date' }),
    consumedAt: timestamp('consumed_at', { withTimezone: true, mode: 'date' }),
    revokedAt: timestamp('revoked_at', { withTimezone: true, mode: 'date' }),
    revocationReason: varchar('revocation_reason', { length: 128 }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    uniqueIndex('formalization_signature_invitations_token_hash_uq').on(table.tokenHash),
    foreignKey({
      name: 'fs_invitation_req_fk',
      columns: [table.requestId],
      foreignColumns: [formalizationSignatureRequestModel.id],
    }).onDelete('restrict'),
    foreignKey({
      name: 'fs_invitation_recipient_fk',
      columns: [table.recipientId],
      foreignColumns: [formalizationSignatureRecipientModel.id],
    }).onDelete('restrict'),
    uniqueIndex('formalization_signature_invitations_recipient_generation_uq').on(
      table.recipientId,
      table.generation,
    ),
    uniqueIndex('formalization_signature_invitations_active_recipient_uq')
      .on(table.recipientId)
      .where(sql`${table.status} = 'active'`),
    index('formalization_signature_invitations_request_status_idx').on(
      table.requestId,
      table.status,
    ),
    index('formalization_signature_invitations_delivery_idx').on(
      table.deliveryStatus,
      table.expiresAt,
    ),
    index('formalization_signature_invitations_expiry_idx').on(
      table.expiresAt,
      table.status,
    ),
    check(
      'formalization_signature_invitations_generation_ck',
      sql`${table.generation} > 0`,
    ),
    check(
      'formalization_signature_invitations_token_hash_ck',
      sql`octet_length(${table.tokenHash}) = 32`,
    ),
  ],
)
