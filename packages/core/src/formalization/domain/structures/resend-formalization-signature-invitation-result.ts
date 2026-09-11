export type ResendFormalizationSignatureInvitationResult = {
  readonly requestId: string
  readonly recipientId: string
  readonly invitationId: string
  readonly generation: number
  readonly deliveryPending: true
}
