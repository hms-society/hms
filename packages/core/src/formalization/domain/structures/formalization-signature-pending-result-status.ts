import { FormalizationSignatureResultStatus } from './formalization-signature-result-status'

export const FormalizationSignaturePendingResultStatus = {
  submitted: FormalizationSignatureResultStatus.submitted,
  reconciliationPending: FormalizationSignatureResultStatus.reconciliationPending,
} as const

export type FormalizationSignaturePendingResultStatus =
  (typeof FormalizationSignaturePendingResultStatus)[keyof typeof FormalizationSignaturePendingResultStatus]
