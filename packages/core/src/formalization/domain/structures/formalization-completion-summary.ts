export type FormalizationCompletionSummary = {
  readonly formalizationId: string
  readonly intakeId: string
  readonly status: 'completed'
  readonly completedAt: Date
  readonly signatureRequestId: string
  readonly signatureStatus: 'confirmed'
}
