export const FormalizationSignatureRecipientStatus = {
  invited: 'invited', authenticating: 'authenticating', locked: 'locked',
  authenticated: 'authenticated', reading: 'reading', signing: 'signing',
  submitted: 'submitted', reconciliationRequired: 'reconciliation_required',
  confirmed: 'confirmed', rejected: 'rejected', cancelled: 'cancelled', expired: 'expired',
} as const
export type FormalizationSignatureRecipientStatus =
  (typeof FormalizationSignatureRecipientStatus)[keyof typeof FormalizationSignatureRecipientStatus]
