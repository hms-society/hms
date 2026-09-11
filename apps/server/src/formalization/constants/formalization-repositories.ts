export const FORMALIZATION_REPOSITORIES = {
  formalizations: Symbol('FORMALIZATION_REPOSITORIES.formalizations'),
  signatureSnapshots: Symbol('FORMALIZATION_REPOSITORIES.signatureSnapshots'),
  signatureRequests: Symbol('FORMALIZATION_REPOSITORIES.signatureRequests'),
  signatureRequestDocuments: Symbol(
    'FORMALIZATION_REPOSITORIES.signatureRequestDocuments',
  ),
  signatureRecipients: Symbol('FORMALIZATION_REPOSITORIES.signatureRecipients'),
  signatureRecipientDocuments: Symbol(
    'FORMALIZATION_REPOSITORIES.signatureRecipientDocuments',
  ),
  signatureDocumentAcknowledgements: Symbol(
    'FORMALIZATION_REPOSITORIES.signatureDocumentAcknowledgements',
  ),
  signatureInvitations: Symbol('FORMALIZATION_REPOSITORIES.signatureInvitations'),
  signatureInvitationSendAttempts: Symbol(
    'FORMALIZATION_REPOSITORIES.signatureInvitationSendAttempts',
  ),
  signatureProviderResources: Symbol(
    'FORMALIZATION_REPOSITORIES.signatureProviderResources',
  ),
  signatureProviderDocumentResources: Symbol(
    'FORMALIZATION_REPOSITORIES.signatureProviderDocumentResources',
  ),
  signatureProviderRecipientResources: Symbol(
    'FORMALIZATION_REPOSITORIES.signatureProviderRecipientResources',
  ),
  signatureProvisioningAttempts: Symbol(
    'FORMALIZATION_REPOSITORIES.signatureProvisioningAttempts',
  ),
  signatureCancellationAttempts: Symbol(
    'FORMALIZATION_REPOSITORIES.signatureCancellationAttempts',
  ),
  signatureOtpGuards: Symbol('FORMALIZATION_REPOSITORIES.signatureOtpGuards'),
  signatureOtpChallenges: Symbol('FORMALIZATION_REPOSITORIES.signatureOtpChallenges'),
  signatureOtpSendAttempts: Symbol('FORMALIZATION_REPOSITORIES.signatureOtpSendAttempts'),
  signatureOtpRateReservations: Symbol(
    'FORMALIZATION_REPOSITORIES.signatureOtpRateReservations',
  ),
  signatureGatewaySessions: Symbol('FORMALIZATION_REPOSITORIES.signatureGatewaySessions'),
  signatureProxyBindings: Symbol('FORMALIZATION_REPOSITORIES.signatureProxyBindings'),
  signatureWebhookReceipts: Symbol('FORMALIZATION_REPOSITORIES.signatureWebhookReceipts'),
  signatureArtifacts: Symbol('FORMALIZATION_REPOSITORIES.signatureArtifacts'),
  signatureProtocols: Symbol('FORMALIZATION_REPOSITORIES.signatureProtocols'),
  signatureAuditWriter: Symbol('FORMALIZATION_REPOSITORIES.signatureAuditWriter'),
} as const

export const FORMALIZATION_DATABASE_OPERATIONS = {
  startTransaction: Symbol('FORMALIZATION_DATABASE_OPERATIONS.startTransaction'),
  closeTransaction: Symbol('FORMALIZATION_DATABASE_OPERATIONS.closeTransaction'),
  signatureGatewayTransaction: Symbol(
    'FORMALIZATION_DATABASE_OPERATIONS.signatureGatewayTransaction',
  ),
  invitationResendTransaction: Symbol(
    'FORMALIZATION_DATABASE_OPERATIONS.invitationResendTransaction',
  ),
} as const
