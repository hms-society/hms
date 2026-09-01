export const FormalizationSignaturePreviewState = {
  Pending: 'pending',
  Processing: 'processing',
  Ready: 'ready',
  Failed: 'failed',
  Stale: 'stale',
  CleanupPending: 'cleanup_pending',
} as const

export type FormalizationSignaturePreviewState =
  (typeof FormalizationSignaturePreviewState)[keyof typeof FormalizationSignaturePreviewState]
