import type {
  Broker,
  DatetimeProvider,
  IdProvider,
  UseCase,
} from '../../shared/interfaces'
import type {
  FormalizationSignatureOtpChallenge,
  FormalizationSignatureOtpRateReservation,
  FormalizationSignatureOtpSendAttempt,
} from '../domain/entities'
import type {
  FormalizationSignatureGatewaySessionsRepository,
  FormalizationSignatureInvitationsRepository,
  FormalizationSignatureOtpChallengesRepository,
  FormalizationSignatureOtpGuardsRepository,
  FormalizationSignatureOtpRateReservationsRepository,
  FormalizationSignatureOtpSendAttemptsRepository,
  FormalizationSignatureGatewayTransaction,
  FormalizationSignatureRecipientsRepository,
  FormalizationSignatureSourceReader,
  SensitivePayloadCipherProvider,
  SignatureOtpMacProvider,
  SignatureSecretHasher,
} from '../interfaces'
import { FormalizationSignatureOtpDeliveryRequestedEvent } from '../domain/events'
import {
  SignatureChannelUnavailableError,
  SignatureSessionInvalidError,
  SignatureOtpRateLimitedError,
  SignatureConsentMissingError,
} from '../domain/errors'

type Request = {
  readonly flowToken: string
  readonly deviceToken: string
  readonly csrfToken: string
  readonly channelChoiceId: string
  readonly sourceIpHash: string
}
type Response = {
  readonly challengeId: string
  readonly expiresAt: Date
  readonly resendAvailableAt: Date
}
type SecretGenerator = { generate(): string; generateNumeric?(length: number): string }
type Dependencies = {
  readonly sessionsRepository: FormalizationSignatureGatewaySessionsRepository
  readonly recipientsRepository: FormalizationSignatureRecipientsRepository
  readonly invitationsRepository: FormalizationSignatureInvitationsRepository
  readonly sourceReader: FormalizationSignatureSourceReader
  readonly challengesRepository: FormalizationSignatureOtpChallengesRepository
  readonly guardsRepository: FormalizationSignatureOtpGuardsRepository
  readonly reservationsRepository: FormalizationSignatureOtpRateReservationsRepository
  readonly sendAttemptsRepository: FormalizationSignatureOtpSendAttemptsRepository
  readonly cipher: SensitivePayloadCipherProvider
  readonly transaction: FormalizationSignatureGatewayTransaction
  readonly idProvider: IdProvider
  readonly secretGenerator: SecretGenerator
  readonly datetimeProvider: DatetimeProvider
  readonly broker: Broker
  readonly hasher: SignatureSecretHasher
  readonly macProvider: SignatureOtpMacProvider
}

export class RequestSignatureOtpUseCase implements UseCase<Request, Response> {
  constructor(private readonly dependencies: Dependencies) {}

  async execute(request: Request): Promise<Response> {
    const session = await this.dependencies.sessionsRepository.findByTokenHash(
      this.dependencies.hasher.hash(request.flowToken),
    )
    if (
      !session ||
      session.kind !== 'flow' ||
      session.status !== 'active' ||
      session.deviceSecretHash !== this.dependencies.hasher.hash(request.deviceToken) ||
      session.csrfHash !== this.dependencies.hasher.hash(request.csrfToken)
    )
      throw new SignatureSessionInvalidError()
    const recipient = await this.dependencies.recipientsRepository.findById(
      session.recipientId,
    )
    if (!recipient) throw new SignatureSessionInvalidError()
    const invitation =
      await this.dependencies.invitationsRepository.findConsumedByRecipientAndRequest({
        recipientId: session.recipientId,
        requestId: session.requestId,
      })
    if (
      !invitation ||
      invitation.recipientId !== recipient.id ||
      invitation.requestId !== session.requestId ||
      invitation.status !== 'consumed'
    )
      throw new SignatureSessionInvalidError()
    const channels =
      await this.dependencies.sourceReader.listConsentedAuthenticationChannels(
        recipient.personId,
      )
    if (channels.length !== 1) throw new SignatureConsentMissingError()
    if (channels[0].id !== request.channelChoiceId || channels[0].kind !== 'email')
      throw new SignatureChannelUnavailableError()
    const now = this.dependencies.datetimeProvider.now()
    const guard = await this.dependencies.guardsRepository.findByInvitationId(
      invitation.id,
    )
    const rollingStartedAt = guard?.rollingWindowStartedAt ?? now
    const rollingWindowStartedAt =
      now.getTime() - rollingStartedAt.getTime() >= 30 * 60_000 ? now : rollingStartedAt
    const invitationSendsCount =
      await this.dependencies.reservationsRepository.countByInvitationIdSince(
        invitation.id,
        rollingWindowStartedAt,
      )
    const sourceIpSendsCount =
      await this.dependencies.reservationsRepository.countBySourceIpHashSince(
        request.sourceIpHash,
        rollingWindowStartedAt,
      )
    if (guard?.lockedUntil && guard.lockedUntil > now)
      throw new SignatureOtpRateLimitedError()
    if (
      invitationSendsCount >= 5 ||
      sourceIpSendsCount >= 20 ||
      (guard?.lastSentAt && now.getTime() - guard.lastSentAt.getTime() < 60_000)
    )
      throw new SignatureOtpRateLimitedError()
    const previousChallenge =
      await this.dependencies.challengesRepository.findCurrentByInvitationId(
        invitation.id,
      )
    const latestChallenge =
      await this.dependencies.challengesRepository.findLatestByInvitationId(invitation.id)
    const generation = (latestChallenge?.generation ?? 0) + 1
    const code =
      this.dependencies.secretGenerator.generateNumeric?.(6) ??
      this.dependencies.secretGenerator.generate()
    if (!/^\d{6}$/.test(code)) throw new SignatureOtpRateLimitedError()
    const challengeId = this.dependencies.idProvider.generate()
    if (!challengeId) throw new SignatureOtpRateLimitedError()
    const expiresAt = new Date(now.getTime() + 30 * 60_000)
    const challenge: FormalizationSignatureOtpChallenge = {
      id: challengeId,
      invitationId: invitation.id,
      generation,
      codeMac: this.dependencies.macProvider.create({ code, challengeId }),
      channelChoiceId: request.channelChoiceId,
      destinationFingerprint: this.dependencies.hasher.hash(
        channels[0].maskedDestination,
      ),
      status: 'pending_delivery',
      failedAttempts: 0,
      issuedAt: now,
      expiresAt,
    }
    const payload = await this.dependencies.cipher.encrypt({
      plaintext: new TextEncoder().encode(code),
      purpose: 'otp_delivery',
      contextId: challenge.id,
    })
    const attempt: FormalizationSignatureOtpSendAttempt = {
      id: this.dependencies.idProvider.generate(),
      challengeId: challenge.id,
      encryptedPayload: payload.ciphertext,
      cipherKeyId: payload.keyId,
      status: 'pending',
      attempts: 0,
    }
    const reservation: FormalizationSignatureOtpRateReservation = {
      id: this.dependencies.idProvider.generate(),
      invitationId: invitation.id,
      sourceIpHash: request.sourceIpHash,
      reservedAt: now,
    }
    const result = await this.dependencies.transaction.issueOtp({
      invitationId: invitation.id,
      expectedInvitationGeneration: invitation.generation,
      expectedGuardVersion: guard?.version ?? 1,
      expectedInvitationSendCount: guard?.sendsInWindow ?? invitationSendsCount,
      expectedSourceIpSendCount: sourceIpSendsCount,
      previousChallengeId: previousChallenge?.id,
      previousChallengeChanges: previousChallenge ? { status: 'superseded' } : undefined,
      challenge,
      guardChanges: {
        failedAttempts: 0,
        rollingWindowStartedAt,
        sendsInWindow: invitationSendsCount + 1,
        lastSentAt: now,
        updatedAt: now,
      },
      deliveryAttempt: attempt,
      rateReservation: reservation,
    })
    if (result !== 'issued') throw new SignatureOtpRateLimitedError()
    await this.dependencies.broker.publish(
      new FormalizationSignatureOtpDeliveryRequestedEvent({
        deliveryAttemptId: attempt.id,
        invitationId: invitation.id,
        channel: 'email',
        encryptedPayload: attempt.encryptedPayload,
        cipherKeyId: attempt.cipherKeyId,
        expiresAt,
        correlationId: challenge.id,
      }),
    )
    return {
      challengeId: challenge.id,
      expiresAt,
      resendAvailableAt: new Date(now.getTime() + 60_000),
    }
  }
}
