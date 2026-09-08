import { pgEnum } from 'drizzle-orm/pg-core'

export const formalizationSignatureRequestDocumentStatusModel = pgEnum(
  'formalization_signature_request_document_status',
  [
    'pending',
    'processing',
    'provisioned',
    'delivery_pending',
    'sent',
    'submitted',
    'reconciliation_required',
    'confirmed',
    'rejected',
    'cancelled',
    'expired',
    'failed',
  ],
)
