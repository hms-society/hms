import { sql } from 'drizzle-orm'
import {
  check,
  foreignKey,
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { signatureBytea } from '../signature-bytea'
import { formalizationSignatureGatewaySessionModel } from './formalization-signature-gateway-session-model'
import { formalizationSignatureRecipientModel } from './formalization-signature-recipient-model'
import { formalizationSignatureRequestDocumentModel } from './formalization-signature-request-document-model'
import { formalizationSignatureRequestModel } from './formalization-signature-request-model'
import { formalizationSignatureSnapshotModel } from './formalization-signature-snapshot-model'

export const formalizationSignatureDocumentAcknowledgementModel = pgTable(
  'formalization_signature_document_acknowledgements',
  {
    id: uuid('id').primaryKey(),
    requestId: uuid('request_id').notNull(),
    requestDocumentId: uuid('request_document_id').notNull(),
    recipientId: uuid('recipient_id').notNull(),
    snapshotId: uuid('snapshot_id').notNull(),
    sessionId: uuid('session_id').notNull(),
    acknowledgedAt: timestamp('acknowledged_at', {
      withTimezone: true,
      mode: 'date',
    }).notNull(),
    sourceIpHash: signatureBytea('source_ip_hash'),
    userAgentHash: signatureBytea('user_agent_hash'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    foreignKey({
      name: 'fs_sig_ack_request_fk',
      columns: [table.requestId],
      foreignColumns: [formalizationSignatureRequestModel.id],
    }).onDelete('restrict'),
    foreignKey({
      name: 'fs_sig_ack_document_fk',
      columns: [table.requestDocumentId],
      foreignColumns: [formalizationSignatureRequestDocumentModel.id],
    }).onDelete('restrict'),
    foreignKey({
      name: 'fs_sig_ack_recipient_fk',
      columns: [table.recipientId],
      foreignColumns: [formalizationSignatureRecipientModel.id],
    }).onDelete('restrict'),
    foreignKey({
      name: 'fs_sig_ack_snapshot_fk',
      columns: [table.snapshotId],
      foreignColumns: [formalizationSignatureSnapshotModel.id],
    }).onDelete('restrict'),
    foreignKey({
      name: 'fs_sig_ack_session_fk',
      columns: [table.sessionId],
      foreignColumns: [formalizationSignatureGatewaySessionModel.id],
    }).onDelete('restrict'),
    uniqueIndex('fs_sig_ack_recipient_document_snapshot_uq').on(
      table.recipientId,
      table.requestDocumentId,
      table.snapshotId,
    ),
    index('fs_sig_ack_recipient_snapshot_idx').on(table.recipientId, table.snapshotId),
    check(
      'fs_sig_ack_source_ip_hash_ck',
      sql`${table.sourceIpHash} is null or octet_length(${table.sourceIpHash}) = 32`,
    ),
    check(
      'fs_sig_ack_user_agent_hash_ck',
      sql`${table.userAgentHash} is null or octet_length(${table.userAgentHash}) = 32`,
    ),
  ],
)
