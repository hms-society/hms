import { sql } from 'drizzle-orm'
import {
  check,
  foreignKey,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { formalizationSignatureProviderModel } from '@/formalization/database/drizzle/models/formalization-signature-provider-model'
import { formalizationSignatureRequestModel } from '@/formalization/database/drizzle/models/formalization-signature-request-model'

export const formalizationSignatureProviderResourceModel = pgTable(
  'formalization_signature_provider_resources',
  {
    id: uuid('id').primaryKey(),
    requestId: uuid('request_id').notNull(),
    provider: formalizationSignatureProviderModel('provider').notNull(),
    providerContractVersion: varchar('provider_contract_version', {
      length: 64,
    }).notNull(),
    providerEnvelopeId: varchar('provider_envelope_id', { length: 255 }).notNull(),
    providerExternalId: varchar('provider_external_id', { length: 255 }).notNull(),
    idempotencyKey: varchar('idempotency_key', { length: 255 }).notNull(),
    lastReconciledAt: timestamp('last_reconciled_at', {
      withTimezone: true,
      mode: 'date',
    }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.requestId],
      foreignColumns: [formalizationSignatureRequestModel.id],
      name: 'fs_sig_provider_resource_request_fk',
    }).onDelete('restrict'),
    uniqueIndex('fs_sig_provider_resource_request_uq').on(table.requestId),
    uniqueIndex('fs_sig_provider_resource_request_id_uq').on(table.requestId, table.id),
    uniqueIndex('formalization_signature_provider_resources_envelope_uq').on(
      table.providerEnvelopeId,
    ),
    uniqueIndex('formalization_signature_provider_resources_external_uq').on(
      table.providerExternalId,
    ),
    uniqueIndex('formalization_signature_provider_resources_idempotency_uq').on(
      table.idempotencyKey,
    ),
    check(
      'formalization_signature_provider_resources_ids_ck',
      sql`${table.providerEnvelopeId} <> '' and ${table.providerExternalId} <> '' and ${table.idempotencyKey} <> ''`,
    ),
  ],
)
