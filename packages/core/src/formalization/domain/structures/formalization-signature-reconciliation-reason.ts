export const FormalizationSignatureReconciliationReason = {
  webhook: 'webhook', unknownEvent: 'unknown_event', scheduled: 'scheduled', artifactRetry: 'artifact_retry', ambiguousSubmission: 'ambiguous_submission',
} as const
export type FormalizationSignatureReconciliationReason =
  (typeof FormalizationSignatureReconciliationReason)[keyof typeof FormalizationSignatureReconciliationReason]
