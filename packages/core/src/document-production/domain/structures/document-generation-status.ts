export const DocumentGenerationStatus = {
  Pending: 'pending',
  Running: 'running',
  Completed: 'completed',
  Failed: 'failed',
  Cancelled: 'cancelled',
} as const

export type DocumentGenerationStatus =
  (typeof DocumentGenerationStatus)[keyof typeof DocumentGenerationStatus]
