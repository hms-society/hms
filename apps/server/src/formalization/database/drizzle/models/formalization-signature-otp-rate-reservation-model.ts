import { signatureBytea } from '@/formalization/database/drizzle/signature-bytea'
import { sql } from 'drizzle-orm'
import { check, foreignKey, index, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core'
import { formalizationSignatureInvitationModel } from '@/formalization/database/drizzle/models/formalization-signature-invitation-model'

export const formalizationSignatureOtpRateReservationModel = pgTable(
  'formalization_signature_otp_rate_reservations',
  {
    id: uuid('id').primaryKey(),
    invitationId: uuid('invitation_id').notNull(),
    sourceIpHash: signatureBytea('source_ip_hash').notNull(),
    reservedAt: timestamp('reserved_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    index('formalization_signature_otp_rate_reservations_invitation_idx').on(
      table.invitationId,
      table.reservedAt,
    ),
    foreignKey({
      name: 'fs_otp_rate_inv_fk',
      columns: [table.invitationId],
      foreignColumns: [formalizationSignatureInvitationModel.id],
    }).onDelete('cascade'),
    index('formalization_signature_otp_rate_reservations_source_ip_idx').on(
      table.sourceIpHash,
      table.reservedAt,
    ),
    check(
      'formalization_signature_otp_rate_reservations_source_ip_ck',
      sql`octet_length(${table.sourceIpHash}) = 32`,
    ),
  ],
)
