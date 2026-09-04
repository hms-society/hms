import {
  foreignKey,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { formalizationSignatureProviderResourceModel } from './formalization-signature-provider-resource-model'
import { formalizationSignatureRequestDocumentModel } from './formalization-signature-request-document-model'
import { formalizationSignatureRequestModel } from './formalization-signature-request-model'

export const formalizationSignatureProviderDocumentResourceModel = pgTable(
  'formalization_signature_provider_document_resources',
  {
    id: uuid('id').primaryKey(),
    requestId: uuid('request_id').notNull(),
    providerResourceId: uuid('provider_resource_id').notNull(),
    requestDocumentId: uuid('request_document_id').notNull(),
    providerEnvelopeItemId: varchar('provider_envelope_item_id', {
      length: 255,
    }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    foreignKey({
      name: 'fs_sig_pdr_request_fk',
      columns: [table.requestId],
      foreignColumns: [formalizationSignatureRequestModel.id],
    }).onDelete('restrict'),
    foreignKey({
      name: 'fs_sig_pdr_resource_fk',
      columns: [table.providerResourceId],
      foreignColumns: [formalizationSignatureProviderResourceModel.id],
    }).onDelete('restrict'),
    foreignKey({
      name: 'fs_sig_pdr_document_fk',
      columns: [table.requestDocumentId],
      foreignColumns: [formalizationSignatureRequestDocumentModel.id],
    }).onDelete('restrict'),
    uniqueIndex('fs_sig_pdr_request_document_uq').on(table.requestDocumentId),
    uniqueIndex('fs_sig_pdr_envelope_item_uq').on(table.providerEnvelopeItemId),
    uniqueIndex('fs_sig_pdr_resource_item_uq').on(
      table.providerResourceId,
      table.providerEnvelopeItemId,
    ),
  ],
)
