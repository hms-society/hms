export const FormalizationSignatureRequestDocumentStatus = {
  pending: 'pending', processing: 'processing', provisioned: 'provisioned', deliveryPending: 'delivery_pending',
  sent: 'sent', submitted: 'submitted', reconciliationRequired: 'reconciliation_required', confirmed: 'confirmed',
  rejected: 'rejected', cancelled: 'cancelled', expired: 'expired', failed: 'failed',
} as const
export type FormalizationSignatureRequestDocumentStatus =
  (typeof FormalizationSignatureRequestDocumentStatus)[keyof typeof FormalizationSignatureRequestDocumentStatus]
