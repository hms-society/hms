import type { DatetimeProvider, IdProvider, UseCase } from '../../shared/interfaces'
import type { FormalizationSignatureGatewaySession } from '../domain/entities'
import {
  SignatureInvitationConsumedError,
  SignatureInvitationExpiredError,
  SignatureInvitationInvalidError,
  SignatureSessionInvalidError,
} from '../domain/errors'
import type {
  FormalizationSignatureGatewaySessionsRepository,
  FormalizationSignatureInvitationsRepository,
  FormalizationSignatureRecipientsRepository,
  FormalizationSignatureRequestsRepository,
  FormalizationSignatureGatewayTransaction,
  SignatureSecretHasher,
} from '../interfaces'

type Request = {
  readonly token: string
  readonly origin: string
  readonly sourceIpHash: string
  readonly userAgentHash: string
}
type Response = {
  readonly flowToken: string
  readonly deviceToken: string
  readonly csrfToken: string
  readonly expiresAt: Date
}
type SecretGenerator = { generate(): string }
type Dependencies = {
  readonly invitationsRepository: FormalizationSignatureInvitationsRepository
  readonly sessionsRepository: FormalizationSignatureGatewaySessionsRepository
  readonly requestsRepository: FormalizationSignatureRequestsRepository
  readonly recipientsRepository: FormalizationSignatureRecipientsRepository
  readonly transaction: FormalizationSignatureGatewayTransaction
  readonly idProvider: IdProvider
  readonly secretGenerator: SecretGenerator
  readonly datetimeProvider: DatetimeProvider
  readonly hasher: SignatureSecretHasher
}

const RECOVERABLE_RECIPIENT_STATUSES = new Set([
  'invited',
  'authenticating',
  'locked',
  'authenticated',
  'reading',
  'signing',
])

export class ExchangeSignatureInvitationUseCase implements UseCase<Request, Response> {
  constructor(private readonly dependencies: Dependencies) {}
  async execute(request: Request): Promise<Response> {
    const invitation = await this.dependencies.invitationsRepository.findByTokenHash(
      this.dependencies.hasher.hash(request.token),
    )
    if (!invitation) throw new SignatureInvitationInvalidError()
    const now = this.dependencies.datetimeProvider.now()
    if (invitation.expiresAt <= now || invitation.status === 'expired')
      throw new SignatureInvitationExpiredError()
    const signatureRequest = await this.dependencies.requestsRepository.findById(
      invitation.requestId,
    )
    const recipient = await this.dependencies.recipientsRepository.findById(
      invitation.recipientId,
    )
    if (!signatureRequest || !recipient || recipient.requestId !== signatureRequest.id)
      throw new SignatureSessionInvalidError()
    const recoverableInvitation =
      invitation.status === 'consumed' &&
      RECOVERABLE_RECIPIENT_STATUSES.has(recipient.status)
    if (invitation.status !== 'active' && !recoverableInvitation)
      throw new SignatureInvitationConsumedError()
    const flowToken = this.dependencies.secretGenerator.generate()
    const deviceToken = this.dependencies.secretGenerator.generate()
    const csrfToken = this.dependencies.secretGenerator.generate()
    const session: FormalizationSignatureGatewaySession = {
      id: this.dependencies.idProvider.generate(),
      requestId: invitation.requestId,
      recipientId: invitation.recipientId,
      snapshotId: signatureRequest.snapshotId,
      kind: 'flow',
      tokenHash: this.dependencies.hasher.hash(flowToken),
      deviceSecretHash: this.dependencies.hasher.hash(deviceToken),
      csrfHash: this.dependencies.hasher.hash(csrfToken),
      status: 'active',
      issuedAt: now,
      expiresAt: invitation.expiresAt,
      version: 1,
    }
    const previousSessions =
      await this.dependencies.sessionsRepository.findActiveByRecipientId(
        invitation.recipientId,
      )
    const result = await this.dependencies.transaction.exchangeInvitation({
      invitationId: invitation.id,
      expectedInvitationGeneration: invitation.generation,
      ...(recipient.actorKind === 'client' && invitation.status === 'active'
        ? { invitationChanges: { status: 'consumed' as const, consumedAt: now } }
        : {}),
      flowSessionIdsToRevoke: previousSessions
        .filter((item) => item.kind === 'flow')
        .map((item) => item.id),
      flowSessionChanges: {
        status: 'revoked',
        revokedAt: now,
        revocationReason: 'rotated',
      },
      flowSession: session,
    })
    if (result === 'conflict') throw new SignatureInvitationConsumedError()
    return { flowToken, deviceToken, csrfToken, expiresAt: session.expiresAt }
  }
}
