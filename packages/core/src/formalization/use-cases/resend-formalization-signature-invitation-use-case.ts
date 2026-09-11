import type {
  Broker,
  DatetimeProvider,
  IdProvider,
  UseCase,
} from '../../shared/interfaces'
import { CollaboratorProfile } from '../../identity/domain/structures'
import type {
  FormalizationSignatureInvitation,
  FormalizationSignatureInvitationSendAttempt,
} from '../domain/entities'
import { FormalizationSignatureInvitationReadyEvent } from '../domain/events'
import {
  FormalizationNotFoundError,
  FormalizationSignatureChannelUnavailableError,
  FormalizationSignatureRequestConflictError,
  FormalizationSignatureSendingForbiddenError,
} from '../domain/errors'
import type {
  FormalizationActor,
  ResendFormalizationSignatureInvitationCommand,
  ResendFormalizationSignatureInvitationResult,
} from '../domain/structures'
import { FormalizationSignatureRecipientStatus } from '../domain/structures'
import type {
  FormalizationsRepository,
  FormalizationSignatureGatewaySessionsRepository,
  FormalizationSignatureInvitationResendTransaction,
  FormalizationSignatureInvitationsRepository,
  FormalizationSignatureProxyBindingsRepository,
  FormalizationSignatureRecipientsRepository,
  FormalizationSignatureRequestsRepository,
  FormalizationSignatureSourceReader,
  SensitivePayloadCipherProvider,
  SignatureSecretHasher,
} from '../interfaces'

type Request = ResendFormalizationSignatureInvitationCommand &
  FormalizationActor & {
    readonly formalizationId: string
    readonly recipientId: string
  }

type SecretGenerator = { generate(): string }
type Dependencies = {
  readonly formalizationsRepository: FormalizationsRepository
  readonly requestsRepository: FormalizationSignatureRequestsRepository
  readonly recipientsRepository: FormalizationSignatureRecipientsRepository
  readonly invitationsRepository: FormalizationSignatureInvitationsRepository
  readonly sessionsRepository: FormalizationSignatureGatewaySessionsRepository
  readonly bindingsRepository: FormalizationSignatureProxyBindingsRepository
  readonly sourceReader: FormalizationSignatureSourceReader
  readonly transaction: FormalizationSignatureInvitationResendTransaction
  readonly cipher: SensitivePayloadCipherProvider
  readonly hasher: SignatureSecretHasher
  readonly secretGenerator: SecretGenerator
  readonly datetimeProvider: DatetimeProvider
  readonly idProvider: IdProvider
  readonly broker: Broker
}

const resendableStatuses = new Set<FormalizationSignatureRecipientStatus>([
  FormalizationSignatureRecipientStatus.invited,
  FormalizationSignatureRecipientStatus.authenticating,
  FormalizationSignatureRecipientStatus.locked,
  FormalizationSignatureRecipientStatus.authenticated,
  FormalizationSignatureRecipientStatus.reading,
  FormalizationSignatureRecipientStatus.reconciliationRequired,
])

export class ResendFormalizationSignatureInvitationUseCase
  implements UseCase<Request, ResendFormalizationSignatureInvitationResult>
{
  constructor(private readonly dependencies: Dependencies) {}

  async execute(request: Request): Promise<ResendFormalizationSignatureInvitationResult> {
    const formalization = await this.dependencies.formalizationsRepository.findById(
      request.formalizationId,
    )
    if (!formalization) throw new FormalizationNotFoundError()
    if (
      formalization.assignedLawyerId !== request.actorId &&
      request.actorProfile !== CollaboratorProfile.Admin
    ) {
      throw new FormalizationSignatureSendingForbiddenError()
    }

    const signatureRequest =
      await this.dependencies.requestsRepository.findCurrentByFormalizationId(
        formalization.id,
      )
    const recipient = await this.dependencies.recipientsRepository.findById(
      request.recipientId,
    )
    if (
      !signatureRequest ||
      !recipient ||
      recipient.requestId !== signatureRequest.id ||
      signatureRequest.formalizationId !== formalization.id ||
      !resendableStatuses.has(recipient.status) ||
      recipient.version !== request.expectedRecipientVersion
    ) {
      throw new FormalizationSignatureRequestConflictError()
    }

    const previousInvitation =
      await this.dependencies.invitationsRepository.findLatestByRecipientId(recipient.id)
    if (
      !previousInvitation ||
      previousInvitation.generation !== request.expectedInvitationGeneration
    ) {
      throw new FormalizationSignatureRequestConflictError()
    }
    const person = await this.dependencies.sourceReader.findPerson(recipient.personId)
    if (!person?.availableChannels.includes(recipient.deliveryChannel)) {
      throw new FormalizationSignatureChannelUnavailableError()
    }

    const now = this.dependencies.datetimeProvider.now()
    const generation = previousInvitation.generation + 1
    const invitationId = this.dependencies.idProvider.generate()
    const invitationToken = this.dependencies.secretGenerator.generate()
    const encryptedPayload = await this.dependencies.cipher.encrypt({
      plaintext: new TextEncoder().encode(JSON.stringify({ token: invitationToken })),
      purpose: 'invitation_delivery',
      contextId: invitationId,
    })
    const invitation: FormalizationSignatureInvitation = {
      id: invitationId,
      requestId: signatureRequest.id,
      recipientId: recipient.id,
      tokenHash: this.dependencies.hasher.hash(invitationToken),
      generation,
      status: 'active',
      deliveryStatus: 'pending',
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      createdAt: now,
    }
    const sendAttempt: FormalizationSignatureInvitationSendAttempt = {
      id: this.dependencies.idProvider.generate(),
      invitationId: invitation.id,
      encryptedPayload: encryptedPayload.ciphertext,
      cipherKeyId: encryptedPayload.keyId,
      status: 'pending',
      attempts: 0,
      createdAt: now,
      updatedAt: now,
    }
    const sessions = await this.dependencies.sessionsRepository.findActiveByRecipientId(
      recipient.id,
    )
    const bindings = await this.dependencies.bindingsRepository.findActiveByRecipientId(
      recipient.id,
    )
    const result = await this.dependencies.transaction.resend({
      requestId: signatureRequest.id,
      recipientId: recipient.id,
      expectedRecipientVersion: request.expectedRecipientVersion,
      recipientChanges: { status: 'invited', invitedAt: now },
      previousInvitationId: previousInvitation.id,
      expectedInvitationGeneration: request.expectedInvitationGeneration,
      previousInvitationChanges: {
        status: 'revoked',
        revokedAt: now,
        revocationReason: 'resent',
      },
      sessionIdsToRevoke: sessions.map((session) => session.id),
      sessionChanges: { status: 'revoked', revokedAt: now, revocationReason: 'resent' },
      bindingIdsToRevoke: bindings.map((binding) => binding.id),
      bindingChanges: { status: 'revoked', revokedAt: now, revocationReason: 'resent' },
      invitation,
      sendAttempt,
      audit: {
        action: 'invitation_resent',
        actorReference: request.actorId,
        occurredAt: now,
        correlationId: invitation.id,
        metadata: { generation },
      },
    })
    if (result === 'conflict') throw new FormalizationSignatureRequestConflictError()

    await this.dependencies.broker.publish(
      new FormalizationSignatureInvitationReadyEvent({
        deliveryAttemptId: sendAttempt.id,
        invitationId: invitation.id,
        recipientId: recipient.id,
        personId: recipient.personId,
        channel: recipient.deliveryChannel,
        encryptedPayload: sendAttempt.encryptedPayload,
        cipherKeyId: sendAttempt.cipherKeyId,
        expiresAt: invitation.expiresAt,
        correlationId: invitation.id,
      }),
    )
    return {
      requestId: signatureRequest.id,
      recipientId: recipient.id,
      invitationId: invitation.id,
      generation,
      deliveryPending: true,
    }
  }
}
