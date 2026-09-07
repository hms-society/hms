import {
  foreignKey,
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { formalizationSignatureRecipientModel } from './formalization-signature-recipient-model'
import { formalizationSignatureRequestDocumentModel } from './formalization-signature-request-document-model'
import { formalizationSignatureRequestModel } from './formalization-signature-request-model'

export const formalizationSignatureRecipientDocumentModel = pgTable(
  'formalization_signature_recipient_documents',
  {
    id: uuid('id').primaryKey(),
    requestId: uuid('request_id').notNull(),
    recipientId: uuid('recipient_id').notNull(),
    requestDocumentId: uuid('request_document_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    foreignKey({
      name: 'fs_sig_rec_doc_request_fk',
      columns: [table.requestId],
      foreignColumns: [formalizationSignatureRequestModel.id],
    }).onDelete('restrict'),
    foreignKey({
      name: 'fs_sig_rec_doc_recipient_fk',
      columns: [table.recipientId],
      foreignColumns: [formalizationSignatureRecipientModel.id],
    }).onDelete('restrict'),
    foreignKey({
      name: 'fs_sig_rec_doc_document_fk',
      columns: [table.requestDocumentId],
      foreignColumns: [formalizationSignatureRequestDocumentModel.id],
    }).onDelete('restrict'),
    uniqueIndex('fs_sig_rec_doc_recipient_document_uq').on(
      table.recipientId,
      table.requestDocumentId,
    ),
    index('fs_sig_rec_doc_request_recipient_idx').on(table.requestId, table.recipientId),
    index('fs_sig_rec_doc_document_recipient_idx').on(
      table.requestDocumentId,
      table.recipientId,
    ),
  ],
)
