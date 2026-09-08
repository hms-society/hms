import { signatureBytea } from '@/formalization/database/drizzle/signature-bytea'
import { sql } from 'drizzle-orm'
import {
  check,
  foreignKey,
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { formalizationSignatureProviderResourceModel } from '@/formalization/database/drizzle/models/formalization-signature-provider-resource-model'
import { formalizationSignatureRecipientModel } from '@/formalization/database/drizzle/models/formalization-signature-recipient-model'

export const formalizationSignatureProviderRecipientResourceModel = pgTable(
  'formalization_signature_provider_recipient_resources',
  {
    id: uuid('id').primaryKey(),
    requestId: uuid('request_id').notNull(),
    providerResourceId: uuid('provider_resource_id').notNull(),
    recipientId: uuid('recipient_id').notNull(),
    providerRecipientId: varchar('provider_recipient_id', { length: 255 }).notNull(),
    encryptedSigningCredential: signatureBytea('encrypted_signing_credential').notNull(),
    cipherKeyId: varchar('cipher_key_id', { length: 128 }).notNull(),
    lastReconciledAt: timestamp('last_reconciled_at', {
      withTimezone: true,
      mode: 'date',
    }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.providerResourceId],
      foreignColumns: [formalizationSignatureProviderResourceModel.id],
      name: 'fs_sig_prr_provider_resource_fk',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.recipientId],
      foreignColumns: [formalizationSignatureRecipientModel.id],
      name: 'fs_sig_prr_recipient_fk',
    }).onDelete('restrict'),
    uniqueIndex('fs_sig_prr_recipient_uq').on(table.recipientId),
    uniqueIndex('formalization_signature_provider_recipient_resources_provider_id_uq').on(
      table.providerRecipientId,
    ),
    uniqueIndex('formalization_signature_provider_recipient_resources_pair_uq').on(
      table.providerResourceId,
      table.providerRecipientId,
    ),
    index('formalization_signature_provider_recipient_resources_recipient_idx').on(
      table.recipientId,
    ),
    check(
      'formalization_signature_provider_recipient_resources_ids_ck',
      sql`${table.providerRecipientId} <> ''`,
    ),
  ],
)
