import { signatureBytea } from '@/formalization/database/drizzle/signature-bytea'
import { sql } from 'drizzle-orm'
import {
  check,
  foreignKey,
  index,
  jsonb,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { formalizationSignatureInvitationModel } from '@/formalization/database/drizzle/models/formalization-signature-invitation-model'
import { formalizationSignatureGatewaySessionModel } from '@/formalization/database/drizzle/models/formalization-signature-gateway-session-model'
import { formalizationSignatureRecipientKindModel } from '@/formalization/database/drizzle/models/formalization-signature-recipient-kind-model'
import { formalizationSignatureRecipientModel } from '@/formalization/database/drizzle/models/formalization-signature-recipient-model'
import { formalizationSignatureRequestModel } from '@/formalization/database/drizzle/models/formalization-signature-request-model'

type AuditMetadata = Readonly<Record<string, string | number | boolean | null>>

export const formalizationSignatureAuditEntryModel = pgTable(
  'formalization_signature_audit_entries',
  {
    id: uuid('id').primaryKey(),
    requestId: uuid('request_id'),
    recipientId: uuid('recipient_id'),
    invitationId: uuid('invitation_id'),
    sessionId: uuid('session_id'),
    action: varchar('action', { length: 128 }).notNull(),
    actorKind: formalizationSignatureRecipientKindModel('actor_kind'),
    actorReference: varchar('actor_reference', { length: 255 }),
    occurredAt: timestamp('occurred_at', { withTimezone: true, mode: 'date' }).notNull(),
    correlationId: uuid('correlation_id').notNull(),
    sourceIpHash: signatureBytea('source_ip_hash'),
    userAgentHash: signatureBytea('user_agent_hash'),
    metadata: jsonb('metadata').$type<AuditMetadata>().notNull().default({}),
  },
  (table) => [
    foreignKey({
      columns: [table.requestId],
      foreignColumns: [formalizationSignatureRequestModel.id],
      name: 'fs_sig_audit_request_fk',
    }).onDelete('set null'),
    foreignKey({
      columns: [table.recipientId],
      foreignColumns: [formalizationSignatureRecipientModel.id],
      name: 'fs_sig_audit_recipient_fk',
    }).onDelete('set null'),
    foreignKey({
      columns: [table.invitationId],
      foreignColumns: [formalizationSignatureInvitationModel.id],
      name: 'fs_sig_audit_invitation_fk',
    }).onDelete('set null'),
    foreignKey({
      columns: [table.sessionId],
      foreignColumns: [formalizationSignatureGatewaySessionModel.id],
      name: 'fs_sig_audit_session_fk',
    }).onDelete('set null'),
    index('formalization_signature_audit_entries_request_idx').on(
      table.requestId,
      table.occurredAt,
    ),
    index('formalization_signature_audit_entries_recipient_idx').on(
      table.recipientId,
      table.occurredAt,
    ),
    index('formalization_signature_audit_entries_correlation_idx').on(
      table.correlationId,
    ),
    check(
      'formalization_signature_audit_entries_source_ip_hash_ck',
      sql`${table.sourceIpHash} is null or octet_length(${table.sourceIpHash}) = 32`,
    ),
    check(
      'formalization_signature_audit_entries_user_agent_hash_ck',
      sql`${table.userAgentHash} is null or octet_length(${table.userAgentHash}) = 32`,
    ),
    check(
      'formalization_signature_audit_entries_metadata_ck',
      sql`jsonb_typeof(${table.metadata}) = 'object'`,
    ),
  ],
)
