export const DocumentBatchStatus = {
  Pending: 'pending',
  Linked: 'linked',
  Discarded: 'discarded',
  Received: 'received',
  PendingIdentification: 'pending_identification',
  Identified: 'identified',
  AutomaticTriageInProgress: 'automatic_triage_in_progress',
  TriageCompleted: 'triage_completed',
  PendingHumanReview: 'pending_human_review',
  Processed: 'processed',
  WithError: 'with_error',
} as const

export type DocumentBatchStatus =
  (typeof DocumentBatchStatus)[keyof typeof DocumentBatchStatus]
