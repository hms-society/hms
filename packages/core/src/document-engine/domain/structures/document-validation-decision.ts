export const DocumentValidationDecision = {
  Validate: 'validate',
  NotLinked: 'not_linked',
  Illegible: 'illegible',
  Incomplete: 'incomplete',
  Duplicate: 'duplicate',
  Mismatch: 'mismatch',
  Escalate: 'escalate',
} as const

export type DocumentValidationDecision =
  (typeof DocumentValidationDecision)[keyof typeof DocumentValidationDecision]
