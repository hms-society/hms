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
import { formalizationSignatureAccessStatusModel } from '@/formalization/database/drizzle/models/formalization-signature-access-status-model'
import { formalizationSignatureGatewaySessionModel } from '@/formalization/database/drizzle/models/formalization-signature-gateway-session-model'
import { formalizationSignatureRecipientModel } from '@/formalization/database/drizzle/models/formalization-signature-recipient-model'
import { formalizationSignatureRequestModel } from '@/formalization/database/drizzle/models/formalization-signature-request-model'

export const formalizationSignatureProxyBindingModel = pgTable(
  'formalization_signature_proxy_bindings',
  {
    id: uuid('id').primaryKey(),
    sessionId: uuid('session_id').notNull(),
    requestId: uuid('request_id').notNull(),
    recipientId: uuid('recipient_id').notNull(),
    aliasHash: signatureBytea('alias_hash').notNull(),
    encryptedProviderCredential: signatureBytea(
      'encrypted_provider_credential',
    ).notNull(),
    cipherKeyId: varchar('cipher_key_id', { length: 128 }).notNull(),
    providerContractVersion: varchar('provider_contract_version', {
      length: 64,
    }).notNull(),
    status: formalizationSignatureAccessStatusModel('status').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true, mode: 'date' }),
    revocationReason: varchar('revocation_reason', { length: 128 }),
  },
  (table) => [
    uniqueIndex('formalization_signature_proxy_bindings_alias_hash_uq').on(
      table.aliasHash,
    ),
    foreignKey({
      columns: [table.sessionId],
      foreignColumns: [formalizationSignatureGatewaySessionModel.id],
      name: 'fs_sig_proxy_session_fk',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.requestId],
      foreignColumns: [formalizationSignatureRequestModel.id],
      name: 'fs_sig_proxy_request_fk',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.recipientId],
      foreignColumns: [formalizationSignatureRecipientModel.id],
      name: 'fs_sig_proxy_recipient_fk',
    }).onDelete('restrict'),
    index('formalization_signature_proxy_bindings_recipient_status_idx').on(
      table.recipientId,
      table.status,
    ),
    index('formalization_signature_proxy_bindings_expiry_idx').on(
      table.expiresAt,
      table.status,
    ),
    check(
      'formalization_signature_proxy_bindings_alias_hash_ck',
      sql`octet_length(${table.aliasHash}) = 32`,
    ),
  ],
)
