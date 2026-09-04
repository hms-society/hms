import type {
  DatetimeProvider,
  IdProvider,
  UseCase,
  Broker,
} from '../../shared/interfaces'
import type {
  FormalizationSignatureInvitation,
  FormalizationSignatureInvitationSendAttempt,
  FormalizationSignatureProviderDocumentResource,
  FormalizationSignatureProviderRecipientResource,
  FormalizationSignatureProviderResource,
} from '../domain/entities'
import { FormalizationSignatureInvitationReadyEvent } from '../domain/events/formalization-signature-invitation-ready-event'
import { SignatureProviderUnavailableError } from '../domain/errors'
import type {
  FormalizationSignatureDocumentContentReader,
  FormalizationSignatureConfigurationRepository,
  FormalizationSignatureDocumentMetadataReader,
  FormalizationSignatureGatewayTransaction,
  FormalizationSignatureInvitationsRepository,
  FormalizationSignatureInvitationSendAttemptsRepository,
  FormalizationSignatureProviderDocumentResourcesRepository,
  FormalizationSignatureProviderRecipientResourcesRepository,
  FormalizationSignatureProviderResourcesRepository,
  FormalizationSignatureProvisioningAttemptsRepository,
  FormalizationSignatureRecipientDocumentsRepository,
  FormalizationSignatureRecipientsRepository,
  FormalizationSignatureRequestDocumentsRepository,
  FormalizationSignatureRequestsRepository,
  FormalizationSignatureSourceReader,
  FormalizationSignatureSnapshotsRepository,
  SensitivePayloadCipherProvider,
  SignatureProvider,
  SignatureSecretHasher,
} from '../interfaces'

type Request = {
  readonly requestId: string
  readonly attemptToken: string
  readonly occurredAt: Date
}
type Response = {
  readonly outcome:
    | 'provisioned'
    | 'reconciled'
    | 'already_provisioned'
    | 'retry_required'
  readonly invitationIds: readonly string[]
}
type SecretGenerator = { generate(): string }
type Dependencies = {
  readonly attemptsRepository: FormalizationSignatureProvisioningAttemptsRepository
  readonly requestsRepository: FormalizationSignatureRequestsRepository
  readonly documentsRepository: FormalizationSignatureRequestDocumentsRepository
  readonly recipientsRepository: FormalizationSignatureRecipientsRepository
  readonly recipientDocumentsRepository: FormalizationSignatureRecipientDocumentsRepository
  readonly configurationRepository: FormalizationSignatureConfigurationRepository
  readonly metadataReader: FormalizationSignatureDocumentMetadataReader
  readonly sourceReader: FormalizationSignatureSourceReader
  readonly snapshotsRepository: FormalizationSignatureSnapshotsRepository
  readonly contentReader: FormalizationSignatureDocumentContentReader
  readonly providerResourcesRepository: FormalizationSignatureProviderResourcesRepository
  readonly providerDocumentResourcesRepository: FormalizationSignatureProviderDocumentResourcesRepository
  readonly providerRecipientResourcesRepository: FormalizationSignatureProviderRecipientResourcesRepository
  readonly invitationsRepository: FormalizationSignatureInvitationsRepository
  readonly invitationSendAttemptsRepository: FormalizationSignatureInvitationSendAttemptsRepository
  readonly transaction: FormalizationSignatureGatewayTransaction
  readonly provider: SignatureProvider
  readonly cipher: SensitivePayloadCipherProvider
  readonly hasher: SignatureSecretHasher
  readonly idProvider: IdProvider
  readonly secretGenerator: SecretGenerator
  readonly datetimeProvider: DatetimeProvider
  readonly broker: Broker
}

const terminalRequestStatuses = new Set([
  'confirmed',
  'rejected',
  'cancelled',
  'expired',
  'failed',
])
const terminalRecipientStatuses = new Set([
  'confirmed',
  'rejected',
  'cancelled',
  'expired',
])

export class ProvisionFormalizationSignatureRequestUseCase
  implements UseCase<Request, Response>
{
  constructor(private readonly dependencies: Dependencies) {}
  async execute(request: Request): Promise<Response> {
    const attempt = await this.dependencies.attemptsRepository.findByRequestId(
      request.requestId,
    )
    if (!attempt || attempt.attemptToken !== request.attemptToken)
      return { outcome: 'retry_required', invitationIds: [] }
    const signatureRequest = await this.dependencies.requestsRepository.findById(
      request.requestId,
    )
    if (!signatureRequest) return { outcome: 'retry_required', invitationIds: [] }
    if (terminalRequestStatuses.has(signatureRequest.status))
      return { outcome: 'retry_required', invitationIds: [] }
    const existing = await this.dependencies.providerResourcesRepository.findByRequestId(
      signatureRequest.id,
    )
    if (existing) return { outcome: 'already_provisioned', invitationIds: [] }
    const documents = await this.dependencies.documentsRepository.listByRequestId(
      signatureRequest.id,
    )
    const recipients = await this.dependencies.recipientsRepository.listByRequestId(
      signatureRequest.id,
    )
    const configuration =
      await this.dependencies.configurationRepository.findByFormalizationId(
        signatureRequest.formalizationId,
      )
    if (!configuration) return { outcome: 'retry_required', invitationIds: [] }
    const snapshot = await this.dependencies.snapshotsRepository.findById(
      signatureRequest.snapshotId,
    )
    if (
      !snapshot ||
      snapshot.formalizationId !== signatureRequest.formalizationId ||
      snapshot.signatureConfigurationVersion !==
        signatureRequest.signatureConfigurationVersion
    )
      return { outcome: 'retry_required', invitationIds: [] }
    if (
      new Set(documents.map((document) => document.id)).size !== documents.length ||
      documents.some((document) => document.requestId !== signatureRequest.id)
    )
      throw new SignatureProviderUnavailableError()
    if (
      new Set(recipients.map((recipient) => recipient.id)).size !== recipients.length ||
      recipients.some(
        (recipient) =>
          recipient.requestId !== signatureRequest.id ||
          terminalRecipientStatuses.has(recipient.status),
      )
    )
      throw new SignatureProviderUnavailableError()
    const assignments =
      await this.dependencies.recipientDocumentsRepository.listByRequestId(
        signatureRequest.id,
      )
    const expectedAssignments = configuration.signatories.flatMap((signatory) =>
      signatory.documentIds.map((sourceDocumentId) => {
        const document = documents.find(
          (candidate) => candidate.sourceDocumentId === sourceDocumentId,
        )
        const recipient = recipients.find(
          (candidate) => candidate.signatoryId === signatory.signatoryId,
        )
        return recipient && document ? `${recipient.id}:${document.id}` : undefined
      }),
    )
    const actualAssignments = assignments.map(
      (assignment) => `${assignment.recipientId}:${assignment.requestDocumentId}`,
    )
    if (
      expectedAssignments.some((assignment) => !assignment) ||
      new Set(expectedAssignments).size !== expectedAssignments.length ||
      new Set(actualAssignments).size !== actualAssignments.length ||
      actualAssignments.length !== expectedAssignments.length ||
      actualAssignments.some(
        (assignment) => !new Set(expectedAssignments).has(assignment),
      )
    )
      throw new SignatureProviderUnavailableError()
    const providerDocuments = await Promise.all(
      documents.map(async (document) => {
        const bytes = await this.dependencies.contentReader.readContent(
          document.unsignedPrivateFileId,
        )
        if (!bytes) throw new SignatureProviderUnavailableError()
        const source = await this.dependencies.sourceReader.findDocumentVersion(
          signatureRequest.formalizationId,
          document.sourceDocumentVersionId,
        )
        if (!source || source.documentId !== document.sourceDocumentId)
          throw new SignatureProviderUnavailableError()
        return {
          externalId: document.id,
          title: source.name,
          bytes,
          mediaType: 'application/pdf' as const,
          sha256: document.unsignedSha256,
        }
      }),
    )
    const providerRecipients = await Promise.all(
      recipients.map(async (recipient, index) => {
        const signatory = configuration.signatories.find(
          (item) => item.signatoryId === recipient.signatoryId,
        )
        if (!signatory) throw new SignatureProviderUnavailableError()
        const fields = signatory.documentIds.flatMap((documentId) => {
          const document = documents.find((item) => item.sourceDocumentId === documentId)
          const view = configuration.documents.find(
            (item) => item.documentId === documentId,
          )
          if (!document || !view) throw new SignatureProviderUnavailableError()
          return view.fields
            .filter((field) => field.signatoryId === recipient.signatoryId)
            .map((field) => ({
              documentExternalId: document.id,
              page: field.page,
              x: field.positionX,
              y: field.positionY,
              width: field.width,
              height: field.height,
              type: 'signature' as const,
            }))
        })
        return {
          externalId: recipient.id,
          name: recipient.displayNameSnapshot,
          email: `signer-${index}@signing.invalid`,
          fields,
        }
      }),
    )
    const expected = {
      documents: providerDocuments.map((document) => ({
        externalId: document.externalId,
      })),
      recipients: providerRecipients.map((recipient) => ({
        externalId: recipient.externalId,
      })),
    }
    const found = await this.dependencies.provider.findEnvelopeByExternalId(
      signatureRequest.id,
      expected,
    )
    const providerResult =
      found ??
      (await this.dependencies.provider.createEnvelope({
        externalId: signatureRequest.id,
        title: `HMS request ${signatureRequest.id}`,
        documents: providerDocuments,
        recipients: providerRecipients,
        distribution: 'none',
      }))
    const documentIds = new Set(providerDocuments.map((document) => document.externalId))
    const recipientIds = new Set(
      providerRecipients.map((recipient) => recipient.externalId),
    )
    if (
      providerResult.documents.length !== documentIds.size ||
      new Set(providerResult.documents.map((document) => document.externalId)).size !==
        providerResult.documents.length ||
      new Set(providerResult.documents.map((document) => document.providerEnvelopeItemId))
        .size !== providerResult.documents.length ||
      providerResult.documents.some(
        (document) => !documentIds.has(document.externalId),
      ) ||
      providerResult.recipients.length !== recipientIds.size ||
      new Set(providerResult.recipients.map((recipient) => recipient.externalId)).size !==
        providerResult.recipients.length ||
      new Set(providerResult.recipients.map((recipient) => recipient.providerRecipientId))
        .size !== providerResult.recipients.length ||
      providerResult.recipients.some(
        (recipient) => !recipientIds.has(recipient.externalId),
      )
    ) {
      throw new SignatureProviderUnavailableError()
    }
    await this.dependencies.provider.distributeEnvelope({
      providerEnvelopeId: providerResult.providerEnvelopeId,
      distribution: 'none',
    })
    const now = request.occurredAt
    const resource: FormalizationSignatureProviderResource = {
      id: this.dependencies.idProvider.generate(),
      requestId: signatureRequest.id,
      provider: 'documenso',
      providerContractVersion: this.dependencies.provider.getContractVersion(),
      providerEnvelopeId: providerResult.providerEnvelopeId,
      providerExternalId: signatureRequest.id,
      idempotencyKey: signatureRequest.id,
      createdAt: now,
    }
    const documentResources: FormalizationSignatureProviderDocumentResource[] =
      providerResult.documents.map((item) => ({
        id: this.dependencies.idProvider.generate(),
        requestId: signatureRequest.id,
        providerResourceId: resource.id,
        requestDocumentId: item.externalId,
        providerEnvelopeItemId: item.providerEnvelopeItemId,
        createdAt: now,
      }))
    const recipientResources: FormalizationSignatureProviderRecipientResource[] =
      await Promise.all(
        providerResult.recipients.map(async (item) => {
          const encrypted = await this.dependencies.cipher.encrypt({
            plaintext: new TextEncoder().encode(item.rawSigningCredential),
            purpose: 'provider_credential',
            contextId: signatureRequest.id,
          })
          const recipient = recipients.find(
            (candidate) => candidate.id === item.externalId,
          )
          if (!recipient) throw new SignatureProviderUnavailableError()
          return {
            id: this.dependencies.idProvider.generate(),
            requestId: signatureRequest.id,
            providerResourceId: resource.id,
            recipientId: recipient.id,
            providerRecipientId: item.providerRecipientId,
            encryptedSigningCredential: encrypted.ciphertext,
            cipherKeyId: encrypted.keyId,
            createdAt: now,
          }
        }),
      )
    const invitations: FormalizationSignatureInvitation[] = []
    const sendAttempts: FormalizationSignatureInvitationSendAttempt[] = []
    for (const recipient of recipients) {
      const token = this.dependencies.secretGenerator.generate()
      const invitation: FormalizationSignatureInvitation = {
        id: this.dependencies.idProvider.generate(),
        requestId: signatureRequest.id,
        recipientId: recipient.id,
        tokenHash: this.dependencies.hasher.hash(token),
        generation: 1,
        status: 'active',
        deliveryStatus: 'pending',
        expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        createdAt: now,
      }
      const encrypted = await this.dependencies.cipher.encrypt({
        plaintext: new TextEncoder().encode(JSON.stringify({ token })),
        purpose: 'invitation_delivery',
        contextId: invitation.id,
      })
      const deliveryAttempt: FormalizationSignatureInvitationSendAttempt = {
        id: this.dependencies.idProvider.generate(),
        invitationId: invitation.id,
        encryptedPayload: encrypted.ciphertext,
        cipherKeyId: encrypted.keyId,
        status: 'pending',
        attempts: 0,
        createdAt: now,
        updatedAt: now,
      }
      invitations.push(invitation)
      sendAttempts.push(deliveryAttempt)
    }
    const result = await this.dependencies.transaction.completeProvisioning({
      requestId: signatureRequest.id,
      expectedRequestVersion: signatureRequest.version,
      requestChanges: { status: 'sending' },
      requestDocumentChanges: documents.map((document) => ({
        requestDocumentId: document.id,
        expectedVersion: document.version,
        changes: { status: 'provisioned', provisionedAt: now },
      })),
      recipientChanges: recipients.map((recipient) => ({
        recipientId: recipient.id,
        expectedVersion: recipient.version,
        changes: { status: 'invited', invitedAt: now },
      })),
      resource,
      providerDocumentResources: documentResources,
      providerRecipientResources: recipientResources,
      invitations,
      invitationSendAttempts: sendAttempts,
      provisioningAttemptId: attempt.id,
      provisioningAttemptChanges: {
        status: 'provisioned',
        attempts: attempt.attempts + 1,
        updatedAt: now,
      },
      formalizationId: signatureRequest.formalizationId,
      expectedFormalizationVersion: snapshot.formalizationVersion + 1,
      formalizationChanges: {
        signatureRequestId: signatureRequest.id,
        signatureStatus: 'sending',
      },
    })
    if (result === 'conflict') return { outcome: 'retry_required', invitationIds: [] }
    if (result === 'already_provisioned')
      return { outcome: 'already_provisioned', invitationIds: [] }
    for (const [index, invitation] of invitations.entries()) {
      const recipient = recipients[index]
      const attemptEntity = sendAttempts[index]
      await this.dependencies.broker.publish(
        new FormalizationSignatureInvitationReadyEvent({
          deliveryAttemptId: attemptEntity.id,
          invitationId: invitation.id,
          recipientId: recipient.id,
          personId: recipient.personId,
          channel: recipient.deliveryChannel,
          encryptedPayload: attemptEntity.encryptedPayload,
          cipherKeyId: attemptEntity.cipherKeyId,
          expiresAt: invitation.expiresAt,
          correlationId: signatureRequest.id,
        }),
      )
    }
    return {
      outcome: found ? 'reconciled' : 'provisioned',
      invitationIds: invitations.map((invitation) => invitation.id),
    }
  }
}
