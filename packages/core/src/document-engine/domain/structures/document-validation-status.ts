export const DocumentValidationStatus = {
  AwaitingValidation: 'awaiting_validation',
  Valid: 'validated',
  NotLinked: 'not_linked',
  Illegible: 'illegible',
  Incomplete: 'incomplete',
  Duplicate: 'duplicate',
  NotCorresponding: 'not_corresponding',
  ProcessingFailure: 'processing_failure',
  ResendRequested: 'resend_requested',
} as const

export type DocumentValidationStatus =
  (typeof DocumentValidationStatus)[keyof typeof DocumentValidationStatus]
