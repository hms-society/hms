export const FormalizationSignatureSendingIssueCode = {
  notReady: 'not_ready',
  staleConfiguration: 'stale_configuration',
  documentUnavailable: 'document_unavailable',
  missingAssignment: 'missing_assignment',
  missingField: 'missing_field',
  channelUnavailable: 'channel_unavailable',
  consentUnavailable: 'consent_unavailable',
} as const
export type FormalizationSignatureSendingIssueCode =
  (typeof FormalizationSignatureSendingIssueCode)[keyof typeof FormalizationSignatureSendingIssueCode]
