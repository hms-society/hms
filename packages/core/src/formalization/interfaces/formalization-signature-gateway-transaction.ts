import type {
  FormalizationSignatureArtifact,
  FormalizationSignatureCancellationAttempt,
  FormalizationSignatureDocumentAcknowledgement,
  FormalizationSignatureGatewaySession,
  FormalizationSignatureInvitation,
  FormalizationSignatureInvitationSendAttempt,
  FormalizationSignatureOtpChallenge,
  FormalizationSignatureOtpRateReservation,
  FormalizationSignatureOtpSendAttempt,
  FormalizationSignatureProtocol,
  FormalizationSignatureProxyBinding,
  FormalizationSignatureProviderDocumentResource,
  FormalizationSignatureProviderRecipientResource,
  FormalizationSignatureProviderResource,
  FormalizationSignatureProvisioningAttempt,
  FormalizationSignatureRecipient,
  FormalizationSignatureRequest,
  FormalizationSignatureRequestDocument,
  FormalizationSignatureSnapshot,
  FormalizationSignatureWebhookReceipt,
} from '../domain/entities'
import type {
  FormalizationSignatureGatewaySessionChanges,
  FormalizationSignatureInvitationChanges,
  FormalizationSignatureInvitationSendAttemptChanges,
  FormalizationSignatureOtpChallengeChanges,
  FormalizationSignatureOtpGuardChanges,
  FormalizationSignatureProjectionChanges,
  FormalizationSignatureProvisioningAttemptChanges,
  FormalizationSignatureProviderItemStatus,
  FormalizationSignatureProviderEnvelopeStatus,
  FormalizationSignatureProxyBindingChanges,
  FormalizationSignatureRecipientChanges,
  FormalizationSignatureRequestChanges,
  FormalizationSignatureRequestDocumentChanges,
  FormalizationSignatureWebhookReceiptChanges,
} from '../domain/structures'

export interface FormalizationSignatureGatewayTransaction {
  confirmSending(input: {
    formalizationId: string
    expectedFormalizationVersion: number
    expectedSignatureConfigurationVersion: number
    snapshot: FormalizationSignatureSnapshot
    request: FormalizationSignatureRequest
    documents: readonly FormalizationSignatureRequestDocument[]
    recipients: readonly FormalizationSignatureRecipient[]
    recipientDocuments: readonly {
      id: string
      requestId: string
      recipientId: string
      requestDocumentId: string
      createdAt: Date
    }[]
    provisioningAttempt: FormalizationSignatureProvisioningAttempt
    formalizationChanges: FormalizationSignatureProjectionChanges & {
      readonly signatureRequestId: string
      readonly signatureStatus: 'provisioning'
    }
  }): Promise<'applied' | 'conflict' | 'duplicate'>
  requestCancellation(input: {
    requestId: string
    expectedRequestVersion: number
    requestChanges: FormalizationSignatureRequestChanges
    cancellationAttempt: FormalizationSignatureCancellationAttempt
    invitationIdsToRevoke: readonly string[]
    invitationChanges: FormalizationSignatureInvitationChanges
    sessionIdsToRevoke: readonly string[]
    sessionChanges: FormalizationSignatureGatewaySessionChanges
    bindingIdsToRevoke: readonly string[]
    bindingChanges: FormalizationSignatureProxyBindingChanges
    formalizationId: string
    expectedFormalizationVersion: number
    formalizationChanges: FormalizationSignatureProjectionChanges
  }): Promise<'applied' | 'conflict' | 'already_terminal'>
  completeProvisioning(input: {
    requestId: string
    expectedRequestVersion: number
    requestChanges: FormalizationSignatureRequestChanges
    requestDocumentChanges: ReadonlyArray<{
      requestDocumentId: string
      expectedVersion: number
      changes: FormalizationSignatureRequestDocumentChanges
    }>
    recipientChanges: ReadonlyArray<{
      recipientId: string
      expectedVersion: number
      changes: FormalizationSignatureRecipientChanges
    }>
    resource: FormalizationSignatureProviderResource
    providerDocumentResources: readonly FormalizationSignatureProviderDocumentResource[]
    providerRecipientResources: readonly FormalizationSignatureProviderRecipientResource[]
    invitations: readonly FormalizationSignatureInvitation[]
    invitationSendAttempts: readonly FormalizationSignatureInvitationSendAttempt[]
    provisioningAttemptId: string
    provisioningAttemptChanges: FormalizationSignatureProvisioningAttemptChanges
    formalizationId: string
    expectedFormalizationVersion: number
    formalizationChanges: FormalizationSignatureProjectionChanges
  }): Promise<'applied' | 'conflict' | 'already_provisioned'>
  recordInvitationDeliveryAndDerive(input: {
    invitationId: string
    expectedInvitationGeneration: number
    invitationChanges: FormalizationSignatureInvitationChanges
    deliveryAttemptId: string
    deliveryAttemptChanges: FormalizationSignatureInvitationSendAttemptChanges
    recipientId: string
    expectedRecipientVersion: number
    recipientChanges: FormalizationSignatureRecipientChanges
    requestId: string
    expectedRequestVersion: number
    requestChanges: FormalizationSignatureRequestChanges
    formalizationId: string
    expectedFormalizationVersion: number
    formalizationChanges: FormalizationSignatureProjectionChanges
  }): Promise<'applied' | 'conflict' | 'duplicate'>
  exchangeInvitation(input: {
    invitationId: string
    expectedInvitationGeneration: number
    invitationChanges?: FormalizationSignatureInvitationChanges
    flowSessionIdsToRevoke: ReadonlyArray<string>
    flowSessionChanges: FormalizationSignatureGatewaySessionChanges
    flowSession: FormalizationSignatureGatewaySession
  }): Promise<'applied' | 'conflict'>
  establishCollaboratorSession(input: {
    invitationId: string
    expectedInvitationGeneration: number
    invitationChanges: FormalizationSignatureInvitationChanges
    flowSessionId: string
    expectedFlowSessionVersion: number
    flowSessionChanges: FormalizationSignatureGatewaySessionChanges
    authenticatedSessionIdsToRevoke: ReadonlyArray<string>
    authenticatedSessionChanges: FormalizationSignatureGatewaySessionChanges
    authenticatedSession: FormalizationSignatureGatewaySession
    recipientId: string
    expectedRecipientVersion: number
    recipientChanges: { readonly status: 'authenticated' }
    requestId: string
    expectedRequestVersion: number
    requestChanges?: { readonly status: 'in_progress' }
  }): Promise<'applied' | 'conflict'>
  acknowledgeDocument(input: {
    sessionId: string
    expectedSessionVersion: number
    requestId: string
    expectedRequestVersion: number
    requestDocumentId: string
    acknowledgement: FormalizationSignatureDocumentAcknowledgement
  }): Promise<'applied' | 'conflict' | 'duplicate'>
  issueOtp(input: {
    invitationId: string
    expectedInvitationGeneration: number
    expectedGuardVersion: number
    expectedInvitationSendCount: number
    expectedSourceIpSendCount: number
    previousChallengeId?: string
    previousChallengeChanges?: FormalizationSignatureOtpChallengeChanges
    challenge: FormalizationSignatureOtpChallenge
    guardChanges: FormalizationSignatureOtpGuardChanges
    deliveryAttempt: FormalizationSignatureOtpSendAttempt
    rateReservation: FormalizationSignatureOtpRateReservation
  }): Promise<'issued' | 'conflict'>
  verifyOtp(input: {
    challengeId: string
    expectedChallengeGeneration: number
    challengeChanges: FormalizationSignatureOtpChallengeChanges
    invitationId: string
    expectedGuardVersion: number
    guardChanges: FormalizationSignatureOtpGuardChanges
    flowSessionId: string
    expectedFlowSessionVersion: number
    flowSessionChanges: FormalizationSignatureGatewaySessionChanges
    authenticatedSessionIdsToRevoke: ReadonlyArray<string>
    authenticatedSessionChanges: FormalizationSignatureGatewaySessionChanges
    authenticatedSession?: FormalizationSignatureGatewaySession
    recipientId?: string
    expectedRecipientVersion?: number
    recipientChanges?: FormalizationSignatureRecipientChanges
    requestId?: string
    expectedRequestVersion?: number
    requestChanges?: FormalizationSignatureRequestChanges
  }): Promise<'applied' | 'conflict'>
  startProviderEntry(input: {
    sessionId: string
    expectedSessionVersion: number
    requestId: string
    expectedRequestVersion: number
    recipientId: string
    expectedRecipientVersion: number
    operation:
      | { readonly kind: 'create'; readonly binding: FormalizationSignatureProxyBinding }
      | {
          readonly kind: 'rotate'
          readonly bindingId: string
          readonly expectedAliasHash: string
          readonly replacementAliasHash: string
          readonly replacementExpiresAt: Date
        }
    recipientChanges: { readonly status: 'signing' }
  }): Promise<'created' | 'rotated' | 'conflict' | 'invalid_binding'>
  recordSubmission(input: {
    requestId: string
    recipientId: string
    expectedRecipientVersion: number
    sessionId: string
    expectedSessionVersion: number
    bindingId: string
    expectedBindingAliasHash: string
    providerObservationId: string
    submittedAt: Date
  }): Promise<'applied' | 'duplicate' | 'conflict'>
  claimWebhookReceipt(input: {
    receiptId: string
    claimToken: string
    now: Date
    leaseUntil: Date
  }): Promise<
    | {
        outcome: 'claimed' | 'already_processed'
        receipt: FormalizationSignatureWebhookReceipt
      }
    | { outcome: 'missing' | 'busy' }
  >
  failWebhookReceiptClaim(input: {
    receiptId: string
    expectedClaimToken: string
    failedAt: Date
    nextAttemptAt: Date
  }): Promise<'applied' | 'conflict'>
  completeWebhookReceiptClaim(input: {
    receiptId: string
    expectedClaimToken: string
    processedAt: Date
  }): Promise<'applied' | 'conflict'>
  recordProviderObservationAndDerive(input: {
    observationScope: 'partial_hint' | 'authoritative_envelope'
    envelopeStatus: FormalizationSignatureProviderEnvelopeStatus
    receiptUpdates: ReadonlyArray<{
      receiptId: string
      expectedClaimToken?: string
      receiptChanges: FormalizationSignatureWebhookReceiptChanges
    }>
    recipientObservations: ReadonlyArray<{
      recipientId: string
      expectedRecipientVersion: number
      recipientChanges: FormalizationSignatureRecipientChanges
      recipientDocumentObservations: ReadonlyArray<{
        requestDocumentId: string
        providerEnvelopeItemId: string
        assignment: 'required' | 'not_required'
        status: FormalizationSignatureProviderItemStatus
        requiredFieldCount: number
        completedFieldCount: number
      }>
    }>
    requestDocumentChanges: ReadonlyArray<{
      requestDocumentId: string
      expectedVersion: number
      changes: FormalizationSignatureRequestDocumentChanges
    }>
    requestId: string
    expectedRequestVersion: number
  }): Promise<'applied' | 'conflict' | 'unchanged'>
  confirmEnvelopeAndDerive(input: {
    requestId: string
    expectedRequestVersion: number
    recipientChanges: ReadonlyArray<{
      recipientId: string
      expectedVersion: number
      changes: { readonly status: 'confirmed'; readonly confirmedAt: Date }
    }>
    protocols: readonly FormalizationSignatureProtocol[]
    artifactsToAdd: readonly FormalizationSignatureArtifact[]
    requestDocumentChanges: ReadonlyArray<{
      requestDocumentId: string
      expectedVersion: number
      changes: { readonly status: 'confirmed'; readonly confirmedAt: Date }
    }>
  }): Promise<'applied' | 'conflict'>
  deriveTerminalOutcome(input: {
    requestId: string
    expectedRequestVersion: number
    recipientChanges: ReadonlyArray<{
      recipientId: string
      expectedVersion: number
      changes: FormalizationSignatureRecipientChanges
    }>
    requestDocumentChanges: ReadonlyArray<{
      requestDocumentId: string
      expectedVersion: number
      changes: FormalizationSignatureRequestDocumentChanges
    }>
    terminalAt: Date
  }): Promise<'applied' | 'conflict' | 'already_terminal'>
}
