import type { DatetimeProvider, IdProvider, UseCase } from '../../shared/interfaces'
import type { FormalizationSignatureGatewaySession } from '../domain/entities'
import type {
  FormalizationSignatureGatewaySessionsRepository,
  FormalizationSignatureInvitationsRepository,
  FormalizationSignatureOtpChallengesRepository,
  FormalizationSignatureOtpGuardsRepository,
  FormalizationSignatureRecipientsRepository,
  FormalizationSignatureRequestsRepository,
  FormalizationSignatureGatewayTransaction,
  SignatureSecretHasher,
  SignatureSecretVerifier,
} from '../interfaces'
import {
  SignatureOtpInvalidError,
  SignatureOtpExpiredError,
  SignatureOtpSupersededError,
  SignatureOtpConsumedError,
  SignatureOtpLockedError,
  SignatureSessionInvalidError,
} from '../domain/errors'

type Request = {
  readonly flowToken: string
  readonly deviceToken: string
  readonly csrfToken: string
  readonly challengeId: string
  readonly code: string
  readonly sourceIpHash: string
}
type Response = {
  readonly authenticatedToken: string
  readonly deviceToken: string
  readonly csrfToken: string
  readonly expiresAt: Date
}
type SecretGenerator = { generate(): string }
type Dependencies = {
  readonly sessionsRepository: FormalizationSignatureGatewaySessionsRepository
  readonly invitationsRepository: FormalizationSignatureInvitationsRepository
  readonly challengesRepository: FormalizationSignatureOtpChallengesRepository
  readonly guardsRepository: FormalizationSignatureOtpGuardsRepository
  readonly recipientsRepository: FormalizationSignatureRecipientsRepository
  readonly requestsRepository: FormalizationSignatureRequestsRepository
  readonly transaction: FormalizationSignatureGatewayTransaction
  readonly idProvider: IdProvider
  readonly secretGenerator: SecretGenerator
  readonly datetimeProvider: DatetimeProvider
  readonly verifier: SignatureSecretVerifier
  readonly hasher: SignatureSecretHasher
}

const CLIENT_AUTHENTICATABLE_RECIPIENT_STATUSES = new Set([
  'invited',
  'authenticating',
  'locked',
  'authenticated',
  'reading',
  'signing',
])

export class VerifySignatureOtpUseCase implements UseCase<Request, Response> {
  constructor(private readonly dependencies: Dependencies) {}

  async execute(request: Request): Promise<Response> {
    const session = await this.dependencies.sessionsRepository.findByTokenHash(
      this.dependencies.hasher.hash(request.flowToken),
    )
    if (
      session?.kind !== 'flow' ||
      session.status !== 'active' ||
      session.deviceSecretHash !== this.dependencies.hasher.hash(request.deviceToken) ||
      session.csrfHash !== this.dependencies.hasher.hash(request.csrfToken)
    )
      throw new SignatureSessionInvalidError()
    const now = this.dependencies.datetimeProvider.now()
    if (session.expiresAt <= now) throw new SignatureSessionInvalidError()
    const invitation =
      await this.dependencies.invitationsRepository.findConsumedByRecipientAndRequest({
        recipientId: session.recipientId,
        requestId: session.requestId,
      })
    if (
      !invitation ||
      invitation.recipientId !== session.recipientId ||
      invitation.requestId !== session.requestId ||
      invitation.status !== 'consumed'
    )
      throw new SignatureSessionInvalidError()
    const [recipient, signatureRequest] = await Promise.all([
      this.dependencies.recipientsRepository.findById(session.recipientId),
      this.dependencies.requestsRepository.findById(session.requestId),
    ])
    if (
      !recipient ||
      recipient.requestId !== session.requestId ||
      !CLIENT_AUTHENTICATABLE_RECIPIENT_STATUSES.has(recipient.status) ||
      !signatureRequest ||
      !['sending', 'sent', 'in_progress', 'partially_submitted'].includes(
        signatureRequest.status,
      )
    )
      throw new SignatureSessionInvalidError()
    const challenge =
      await this.dependencies.challengesRepository.findCurrentByInvitationId(
        invitation.id,
      )
    if (!challenge || challenge.id !== request.challengeId)
      throw new SignatureOtpInvalidError()
    if (challenge.invitationId !== invitation.id) throw new SignatureOtpInvalidError()
    if (challenge.status === 'superseded') throw new SignatureOtpSupersededError()
    if (challenge.status === 'consumed') throw new SignatureOtpConsumedError()
    if (
      challenge.status !== 'active' ||
      !challenge.expiresAt ||
      challenge.expiresAt <= now
    )
      throw new SignatureOtpExpiredError()
    if (!/^\d{6}$/.test(request.code)) throw new SignatureOtpInvalidError()
    const guard = await this.dependencies.guardsRepository.findByInvitationId(
      invitation.id,
    )
    if (!guard) throw new SignatureOtpInvalidError()
    const isValid = this.dependencies.verifier.verify({
      secret: request.code,
      verifier: challenge.codeMac,
    })
    if (!isValid) {
      const failedAttempts = challenge.failedAttempts + 1
      const lockedUntil =
        failedAttempts >= 5 ? new Date(now.getTime() + 15 * 60_000) : undefined
      const result = await this.dependencies.transaction.verifyOtp({
        challengeId: challenge.id,
        expectedChallengeGeneration: challenge.generation,
        challengeChanges: { failedAttempts },
        invitationId: invitation.id,
        expectedGuardVersion: guard.version,
        guardChanges: { failedAttempts, lockedUntil, updatedAt: now },
        flowSessionId: session.id,
        expectedFlowSessionVersion: session.version,
        flowSessionChanges: {},
        authenticatedSessionIdsToRevoke: [],
        authenticatedSessionChanges: {},
      })
      if (result === 'conflict') throw new SignatureOtpInvalidError()
      if (lockedUntil) throw new SignatureOtpLockedError()
      throw new SignatureOtpInvalidError()
    }
    const token = this.dependencies.secretGenerator.generate()
    const device = this.dependencies.secretGenerator.generate()
    const csrf = this.dependencies.secretGenerator.generate()
    const authenticated: FormalizationSignatureGatewaySession = {
      ...session,
      id: this.dependencies.idProvider.generate(),
      kind: 'authenticated',
      tokenHash: this.dependencies.hasher.hash(token),
      deviceSecretHash: this.dependencies.hasher.hash(device),
      csrfHash: this.dependencies.hasher.hash(csrf),
      version: 1,
    }
    const result = await this.dependencies.transaction.verifyOtp({
      challengeId: challenge.id,
      expectedChallengeGeneration: challenge.generation,
      challengeChanges: { status: 'consumed', consumedAt: now },
      invitationId: invitation.id,
      expectedGuardVersion: guard.version,
      guardChanges: { updatedAt: now },
      flowSessionId: session.id,
      expectedFlowSessionVersion: session.version,
      flowSessionChanges: {
        status: 'revoked',
        revokedAt: now,
        revocationReason: 'rotated',
      },
      authenticatedSessionIdsToRevoke: [],
      authenticatedSessionChanges: {
        status: 'revoked',
        revokedAt: now,
        revocationReason: 'rotated',
      },
      authenticatedSession: authenticated,
      recipientId: recipient.id,
      expectedRecipientVersion: recipient.version,
      recipientChanges: { status: 'authenticated' },
      requestId: signatureRequest.id,
      expectedRequestVersion: signatureRequest.version,
      requestChanges: ['sending', 'sent'].includes(signatureRequest.status)
        ? { status: 'in_progress' }
        : undefined,
    })
    if (result === 'conflict') throw new SignatureOtpInvalidError()
    return {
      authenticatedToken: token,
      deviceToken: device,
      csrfToken: csrf,
      expiresAt: authenticated.expiresAt,
    }
  }
}
