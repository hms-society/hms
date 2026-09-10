export type FormalizationSignatureSendingCancellationResponse = {
  readonly requestId: string
  readonly outcome: 'scheduled' | 'already_terminal'
  readonly cancellationPending: boolean
}
