import { Inject, Injectable } from '@nestjs/common'
import type {
  FormalizationSignatureCancellationAttemptsRepository,
  FormalizationSignatureConfigurationRepository,
  FormalizationSignatureDocumentMetadataReader,
  FormalizationSignatureGatewaySessionsRepository,
  FormalizationSignatureGatewayTransaction,
  FormalizationSignatureInvitationsRepository,
  FormalizationSignatureProxyBindingsRepository,
  FormalizationSignatureRequestDocumentsRepository,
  FormalizationSignatureRequestsRepository,
  FormalizationSignatureSourceReader,
  FormalizationSignatureDocumentContentReader,
  FormalizationSignatureDocumentAcknowledgementsRepository,
  FormalizationSignatureRecipientDocumentsRepository,
  FormalizationSignatureRecipientsRepository,
  SignatureProvider,
  SensitivePayloadCipherProvider,
  SignatureOtpMacProvider,
  SignatureSecretVerifier,
  FormalizationsRepository,
  SignatureSecretHasher,
} from '@hms/core/formalization/interfaces'
import { FormalizationSignatureRequestConflictError } from '@hms/core/formalization/domain/errors'
import type { CollaboratorProfile } from '@hms/core/identity/domain/structures'
import {
  CancelFormalizationSignatureSendingUseCase,
  ConfirmFormalizationSignatureSendingUseCase,
  GetFormalizationSignatureSendingReviewUseCase,
  GetFormalizationSignatureSendingStatusUseCase,
  AcknowledgeSignatureDocumentUseCase,
  CloseSignatureResultUseCase,
  EstablishCollaboratorSigningSessionUseCase,
  ExchangeSignatureInvitationUseCase,
  GetSignatureDocumentUseCase,
  GetSignatureGatewayContextUseCase,
  GetSignatureResultUseCase,
  ListSignatureAuthenticationChannelsUseCase,
  RequestSignatureOtpUseCase,
  StartFormalizationSigningUseCase,
  ReceiveSignatureProviderWebhookUseCase,
  RecordProviderSubmissionUseCase,
  VerifySignatureOtpUseCase,
} from '@hms/core/formalization/use-cases'
import type { Broker, IdProvider, DatetimeProvider } from '@hms/core/shared/interfaces'

import {
  FORMALIZATION_DATABASE_OPERATIONS,
  FORMALIZATION_REPOSITORIES,
} from '@/formalization/constants/formalization-repositories'
import { FORMALIZATION_PROVIDERS } from '@/formalization/constants/formalization-providers'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'
import { DatetimeProvider as ServerDatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { IdProvider as ServerIdProvider } from '@/shared/provision/id/id-provider'

@Injectable()
export class FormalizationSignatureSendingService {
  private readonly reviewUseCase: GetFormalizationSignatureSendingReviewUseCase
  private readonly statusUseCase: GetFormalizationSignatureSendingStatusUseCase
  private readonly confirmUseCase: ConfirmFormalizationSignatureSendingUseCase
  private readonly cancelUseCase: CancelFormalizationSignatureSendingUseCase

  constructor(
    @Inject(FORMALIZATION_REPOSITORIES.formalizations)
    private readonly formalizationsRepository: FormalizationsRepository,
    @Inject(FORMALIZATION_PROVIDERS.signatureConfigurationRepository)
    configurationRepository: FormalizationSignatureConfigurationRepository,
    @Inject(FORMALIZATION_PROVIDERS.signatureSourceReader)
    sourceReader: FormalizationSignatureSourceReader,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRequests)
    private readonly requestsRepository: FormalizationSignatureRequestsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRequestDocuments)
    requestDocumentsRepository: FormalizationSignatureRequestDocumentsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRecipients)
    recipientsRepository: FormalizationSignatureRecipientsRepository,
    @Inject(FORMALIZATION_PROVIDERS.documentMetadataReader)
    metadataReader: FormalizationSignatureDocumentMetadataReader,
    @Inject(FORMALIZATION_DATABASE_OPERATIONS.signatureGatewayTransaction)
    transaction: FormalizationSignatureGatewayTransaction,
    @Inject(FORMALIZATION_REPOSITORIES.signatureCancellationAttempts)
    cancellationsRepository: FormalizationSignatureCancellationAttemptsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureInvitations)
    invitationsRepository: FormalizationSignatureInvitationsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureGatewaySessions)
    sessionsRepository: FormalizationSignatureGatewaySessionsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureProxyBindings)
    bindingsRepository: FormalizationSignatureProxyBindingsRepository,
    @Inject(FORMALIZATION_PROVIDERS.signatureSecretHasher)
    hasher: SignatureSecretHasher,
    @Inject(ServerDatetimeProvider)
    datetimeProvider: DatetimeProvider,
    @Inject(ServerIdProvider)
    idProvider: IdProvider,
    @Inject(InngestBroker)
    broker: Broker,
  ) {
    this.reviewUseCase = new GetFormalizationSignatureSendingReviewUseCase({
      formalizationsRepository,
      configurationRepository,
      sourceReader,
      metadataReader,
      requestsRepository,
    })
    this.statusUseCase = new GetFormalizationSignatureSendingStatusUseCase({
      formalizationsRepository,
      requestsRepository,
      documentsRepository: requestDocumentsRepository,
    })
    this.confirmUseCase = new ConfirmFormalizationSignatureSendingUseCase({
      formalizationsRepository,
      configurationRepository,
      sourceReader,
      requestsRepository,
      transaction,
      idProvider,
      datetimeProvider,
      broker,
      hasher,
      metadataReader,
    })
    this.cancelUseCase = new CancelFormalizationSignatureSendingUseCase({
      requestsRepository,
      recipientsRepository,
      cancellationsRepository,
      invitationsRepository,
      sessionsRepository,
      bindingsRepository,
      transaction,
      idProvider,
      datetimeProvider,
      broker,
    })
  }

  getReview(
    input: Parameters<GetFormalizationSignatureSendingReviewUseCase['execute']>[0],
  ) {
    return this.reviewUseCase.execute(input)
  }

  getStatus(
    input: Parameters<GetFormalizationSignatureSendingStatusUseCase['execute']>[0],
  ) {
    return this.statusUseCase.execute(input)
  }

  confirm(input: Parameters<ConfirmFormalizationSignatureSendingUseCase['execute']>[0]) {
    return this.confirmUseCase.execute(input)
  }

  async cancel(input: {
    formalizationId: string
    actorId: string
    actorProfile: CollaboratorProfile
    expectedRequestVersion: number
    expectedFormalizationVersion: number
  }) {
    const formalization = await this.formalizationsRepository.findById(
      input.formalizationId,
    )
    if (
      !formalization ||
      (formalization.assignedLawyerId !== input.actorId && input.actorProfile !== 'admin')
    ) {
      throw new FormalizationSignatureRequestConflictError()
    }

    const request = await this.requestsRepository.findCurrentByFormalizationId(
      input.formalizationId,
    )
    if (!request) throw new FormalizationSignatureRequestConflictError()

    return this.cancelUseCase.execute({
      requestId: request.id,
      actorId: input.actorId,
      expectedRequestVersion: input.expectedRequestVersion,
      expectedFormalizationVersion: input.expectedFormalizationVersion,
    })
  }
}

/**
 * Server-only composition for the recipient Gateway. Credentials are accepted
 * as arguments from the HTTP boundary and never appear in a response object
 * except through HttpOnly cookies managed by the controller.
 */
@Injectable()
export class FormalizationSigningGatewayService {
  private readonly contentReader: FormalizationSignatureDocumentContentReader
  private readonly cipher: SensitivePayloadCipherProvider
  private readonly exchangeUseCase: ExchangeSignatureInvitationUseCase
  private readonly contextUseCase: GetSignatureGatewayContextUseCase
  private readonly channelsUseCase: ListSignatureAuthenticationChannelsUseCase
  private readonly requestOtpUseCase: RequestSignatureOtpUseCase
  private readonly verifyOtpUseCase: VerifySignatureOtpUseCase
  private readonly collaboratorSessionUseCase: EstablishCollaboratorSigningSessionUseCase
  private readonly documentUseCase: GetSignatureDocumentUseCase
  private readonly acknowledgeUseCase: AcknowledgeSignatureDocumentUseCase
  private readonly startUseCase: StartFormalizationSigningUseCase
  private readonly resultUseCase: GetSignatureResultUseCase
  private readonly closeResultUseCase: CloseSignatureResultUseCase
  private readonly receiveWebhookUseCase: ReceiveSignatureProviderWebhookUseCase
  private readonly recordSubmissionUseCase: RecordProviderSubmissionUseCase

  constructor(
    @Inject(FORMALIZATION_REPOSITORIES.signatureInvitations)
    invitationsRepository: FormalizationSignatureInvitationsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureGatewaySessions)
    private readonly sessionsRepository: FormalizationSignatureGatewaySessionsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRequests)
    requestsRepository: FormalizationSignatureRequestsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRequestDocuments)
    documentsRepository: FormalizationSignatureRequestDocumentsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRecipients)
    private readonly recipientsRepository: FormalizationSignatureRecipientsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRecipientDocuments)
    assignmentsRepository: FormalizationSignatureRecipientDocumentsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureDocumentAcknowledgements)
    acknowledgementsRepository: FormalizationSignatureDocumentAcknowledgementsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureProtocols)
    protocolsRepository: import('@hms/core/formalization/interfaces').FormalizationSignatureProtocolsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureOtpChallenges)
    challengesRepository: import('@hms/core/formalization/interfaces').FormalizationSignatureOtpChallengesRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureOtpGuards)
    guardsRepository: import('@hms/core/formalization/interfaces').FormalizationSignatureOtpGuardsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureOtpRateReservations)
    reservationsRepository: import('@hms/core/formalization/interfaces').FormalizationSignatureOtpRateReservationsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureOtpSendAttempts)
    otpSendAttemptsRepository: import('@hms/core/formalization/interfaces').FormalizationSignatureOtpSendAttemptsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureWebhookReceipts)
    webhookReceiptsRepository: import('@hms/core/formalization/interfaces').FormalizationSignatureWebhookReceiptsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureProxyBindings)
    private readonly bindingsRepository: FormalizationSignatureProxyBindingsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureProviderResources)
    providerResourcesRepository: import('@hms/core/formalization/interfaces').FormalizationSignatureProviderResourcesRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureProviderRecipientResources)
    providerRecipientResourcesRepository: import('@hms/core/formalization/interfaces').FormalizationSignatureProviderRecipientResourcesRepository,
    @Inject(FORMALIZATION_PROVIDERS.signatureProvider)
    provider: SignatureProvider,
    @Inject(FORMALIZATION_PROVIDERS.signatureSourceReader)
    sourceReader: FormalizationSignatureSourceReader,
    @Inject(FORMALIZATION_PROVIDERS.signatureDocumentContentReader)
    contentReader: FormalizationSignatureDocumentContentReader,
    @Inject(FORMALIZATION_PROVIDERS.sensitivePayloadCipher)
    cipher: SensitivePayloadCipherProvider,
    @Inject(FORMALIZATION_PROVIDERS.signatureOtpMacProvider)
    macProvider: SignatureOtpMacProvider,
    @Inject(FORMALIZATION_PROVIDERS.signatureSecretVerifier)
    verifier: SignatureSecretVerifier,
    @Inject(FORMALIZATION_PROVIDERS.signatureSecretHasher)
    hasher: SignatureSecretHasher,
    @Inject(FORMALIZATION_DATABASE_OPERATIONS.signatureGatewayTransaction)
    transaction: FormalizationSignatureGatewayTransaction,
    @Inject(ServerDatetimeProvider)
    private readonly datetimeProvider: DatetimeProvider,
    @Inject(ServerIdProvider)
    idProvider: IdProvider,
    @Inject(FORMALIZATION_PROVIDERS.signatureSecretGenerator)
    secretGenerator: { generate(): string; generateNumeric(length: number): string },
    @Inject(InngestBroker)
    broker: Broker,
  ) {
    this.exchangeUseCase = new ExchangeSignatureInvitationUseCase({
      invitationsRepository,
      sessionsRepository,
      requestsRepository,
      recipientsRepository,
      transaction,
      idProvider,
      secretGenerator,
      datetimeProvider,
      hasher,
    })
    this.contextUseCase = new GetSignatureGatewayContextUseCase({
      sessionsRepository,
      recipientsRepository,
      documentsRepository,
      requestsRepository,
      protocolsRepository,
      assignmentsRepository,
      acknowledgementsRepository,
      bindingsRepository,
      sourceReader,
      hasher,
      secretGenerator,
      datetimeProvider,
    })
    this.channelsUseCase = new ListSignatureAuthenticationChannelsUseCase({
      sessionsRepository,
      sourceReader,
      hasher,
    })
    this.requestOtpUseCase = new RequestSignatureOtpUseCase({
      sessionsRepository,
      recipientsRepository,
      invitationsRepository,
      sourceReader,
      challengesRepository,
      guardsRepository,
      reservationsRepository,
      sendAttemptsRepository: otpSendAttemptsRepository,
      cipher,
      transaction,
      idProvider,
      secretGenerator,
      datetimeProvider,
      broker,
      hasher,
      macProvider,
    })
    this.verifyOtpUseCase = new VerifySignatureOtpUseCase({
      sessionsRepository,
      recipientsRepository,
      requestsRepository,
      invitationsRepository,
      challengesRepository,
      guardsRepository,
      transaction,
      idProvider,
      secretGenerator: idProvider,
      datetimeProvider,
      verifier,
      hasher,
    })
    this.collaboratorSessionUseCase = new EstablishCollaboratorSigningSessionUseCase({
      sessionsRepository,
      invitationsRepository,
      recipientsRepository,
      requestsRepository,
      assignmentsRepository,
      sourceReader,
      transaction,
      idProvider,
      datetimeProvider,
      hasher,
    })
    this.documentUseCase = new GetSignatureDocumentUseCase({
      sessionsRepository,
      documentsRepository,
      requestsRepository,
      recipientsRepository,
      assignmentsRepository,
      sourceReader,
      hasher,
      datetimeProvider,
    })
    this.acknowledgeUseCase = new AcknowledgeSignatureDocumentUseCase({
      sessionsRepository,
      requestsRepository,
      documentsRepository,
      acknowledgementsRepository,
      assignmentsRepository,
      recipientsRepository,
      sourceReader,
      transaction,
      idProvider,
      datetimeProvider,
      hasher,
    })
    this.startUseCase = new StartFormalizationSigningUseCase({
      sessionsRepository,
      requestsRepository,
      recipientsRepository,
      documentsRepository,
      assignmentsRepository,
      acknowledgementsRepository,
      bindingsRepository,
      providerResourcesRepository,
      providerRecipientResourcesRepository,
      transaction,
      provider,
      sourceReader,
      idProvider,
      datetimeProvider,
      secretGenerator,
      hasher,
    })
    this.resultUseCase = new GetSignatureResultUseCase({
      sessionsRepository,
      requestsRepository,
      recipientsRepository,
      protocolsRepository,
      datetimeProvider,
      hash: (value) => hasher.hash(value),
    })
    this.closeResultUseCase = new CloseSignatureResultUseCase({
      sessionsRepository,
      hash: (value) => hasher.hash(value),
    })
    this.receiveWebhookUseCase = new ReceiveSignatureProviderWebhookUseCase({
      receiptsRepository: webhookReceiptsRepository,
      idProvider,
      datetimeProvider,
    })
    this.recordSubmissionUseCase = new RecordProviderSubmissionUseCase({
      sessionsRepository,
      bindingsRepository,
      requestsRepository,
      recipientsRepository,
      documentsRepository,
      assignmentsRepository,
      transaction,
      datetimeProvider,
      broker,
    })
    this.contentReader = contentReader
    this.cipher = cipher
    void macProvider
    void verifier
    void broker
  }

  exchange(input: Parameters<ExchangeSignatureInvitationUseCase['execute']>[0]) {
    return this.exchangeUseCase.execute(input)
  }
  context(input: Parameters<GetSignatureGatewayContextUseCase['execute']>[0]) {
    return this.contextUseCase.execute(input)
  }
  channels(input: Parameters<ListSignatureAuthenticationChannelsUseCase['execute']>[0]) {
    return this.channelsUseCase.execute(input)
  }
  requestOtp(input: Parameters<RequestSignatureOtpUseCase['execute']>[0]) {
    return this.requestOtpUseCase.execute(input)
  }
  verifyOtp(input: Parameters<VerifySignatureOtpUseCase['execute']>[0]) {
    return this.verifyOtpUseCase.execute(input)
  }
  establishCollaboratorSession(
    input: Parameters<EstablishCollaboratorSigningSessionUseCase['execute']>[0],
  ) {
    return this.collaboratorSessionUseCase.execute(input)
  }
  document(input: Parameters<GetSignatureDocumentUseCase['execute']>[0]) {
    return this.documentUseCase.execute(input)
  }
  acknowledge(input: Parameters<AcknowledgeSignatureDocumentUseCase['execute']>[0]) {
    return this.acknowledgeUseCase.execute(input)
  }
  async documentContent(input: Parameters<GetSignatureDocumentUseCase['execute']>[0]) {
    const document = await this.document(input)
    const content = await this.contentReader.readContent(document.privateFileId)
    if (!content) throw new Error('The signing document is unavailable.')
    return { document, content }
  }
  start(input: Parameters<StartFormalizationSigningUseCase['execute']>[0]) {
    return this.startUseCase.execute(input)
  }
  result(input: Parameters<GetSignatureResultUseCase['execute']>[0]) {
    return this.resultUseCase.execute(input)
  }
  closeResult(input: Parameters<CloseSignatureResultUseCase['execute']>[0]) {
    return this.closeResultUseCase.execute(input)
  }
  receiveWebhook(
    input: Parameters<ReceiveSignatureProviderWebhookUseCase['execute']>[0],
  ) {
    return this.receiveWebhookUseCase.execute(input)
  }

  async recordProviderSubmission(aliasHash: string) {
    const binding = await this.bindingsRepository.findByAliasHash(aliasHash)
    if (!binding) throw new FormalizationSignatureRequestConflictError()

    const [recipient, sessions] = await Promise.all([
      this.recipientsRepository.findById(binding.recipientId),
      this.sessionsRepository.findActiveByRecipientId(binding.recipientId),
    ])
    const session = sessions.find((item) => item.id === binding.sessionId)
    if (!recipient || !session) throw new FormalizationSignatureRequestConflictError()

    return this.recordSubmissionUseCase.execute({
      requestId: binding.requestId,
      recipientId: binding.recipientId,
      sessionId: binding.sessionId,
      bindingId: binding.id,
      expectedBindingAliasHash: aliasHash,
      providerObservationId: await this.submissionObservationId(binding.id),
      expectedRecipientVersion: recipient.version,
      expectedSessionVersion: session.version,
      submittedAt: this.datetimeProvider.now(),
    })
  }

  async receiveWebhookPayload(input: {
    dedupeKey: string
    hintKind: 'observation' | 'reconciliation_only'
    hint: Uint8Array
    receivedAt: Date
  }) {
    const encrypted = await this.cipher.encrypt({
      plaintext: input.hint,
      purpose: 'webhook',
      contextId: input.dedupeKey,
    })
    return this.receiveWebhook({
      dedupeKey: input.dedupeKey,
      hintKind: input.hintKind,
      encryptedHint: encrypted.ciphertext,
      cipherKeyId: encrypted.keyId,
      receivedAt: input.receivedAt,
    })
  }

  private async submissionObservationId(bindingId: string) {
    const digest = await globalThis.crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(`submission:${bindingId}`),
    )
    return Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, '0'),
    ).join('')
  }
}
