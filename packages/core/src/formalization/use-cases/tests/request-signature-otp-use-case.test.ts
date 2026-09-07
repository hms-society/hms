import { describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import { RequestSignatureOtpUseCase } from '../request-signature-otp-use-case'
import {
  fakeFormalizationSignatureGatewaySession,
  fakeFormalizationSignatureInvitation,
  fakeFormalizationSignatureRecipient,
} from '../../domain/entities/fakers'
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
} from '../../interfaces'
import type { Broker, DatetimeProvider, IdProvider } from '../../../shared/interfaces'

const NOW = new Date('2026-01-01T12:00:00.000Z')

type Dependencies = {
  sessionsRepository: MockProxy<FormalizationSignatureGatewaySessionsRepository>
  recipientsRepository: MockProxy<FormalizationSignatureRecipientsRepository>
  invitationsRepository: MockProxy<FormalizationSignatureInvitationsRepository>
  sourceReader: MockProxy<FormalizationSignatureSourceReader>
  challengesRepository: MockProxy<FormalizationSignatureOtpChallengesRepository>
  guardsRepository: MockProxy<FormalizationSignatureOtpGuardsRepository>
  reservationsRepository: MockProxy<FormalizationSignatureOtpRateReservationsRepository>
  sendAttemptsRepository: MockProxy<FormalizationSignatureOtpSendAttemptsRepository>
  cipher: MockProxy<SensitivePayloadCipherProvider>
  transaction: MockProxy<FormalizationSignatureGatewayTransaction>
  idProvider: MockProxy<IdProvider>
  datetimeProvider: MockProxy<DatetimeProvider>
  broker: MockProxy<Broker>
  hasher: MockProxy<SignatureSecretHasher>
  macProvider: MockProxy<SignatureOtpMacProvider>
}

function makeDependencies(): Dependencies {
  const dependencies = {
    sessionsRepository: mock<FormalizationSignatureGatewaySessionsRepository>(),
    recipientsRepository: mock<FormalizationSignatureRecipientsRepository>(),
    invitationsRepository: mock<FormalizationSignatureInvitationsRepository>(),
    sourceReader: mock<FormalizationSignatureSourceReader>(),
    challengesRepository: mock<FormalizationSignatureOtpChallengesRepository>(),
    guardsRepository: mock<FormalizationSignatureOtpGuardsRepository>(),
    reservationsRepository: mock<FormalizationSignatureOtpRateReservationsRepository>(),
    sendAttemptsRepository: mock<FormalizationSignatureOtpSendAttemptsRepository>(),
    cipher: mock<SensitivePayloadCipherProvider>(),
    transaction: mock<FormalizationSignatureGatewayTransaction>(),
    idProvider: mock<IdProvider>(),
    datetimeProvider: mock<DatetimeProvider>(),
    broker: mock<Broker>(),
    hasher: mock<SignatureSecretHasher>(),
    macProvider: mock<SignatureOtpMacProvider>(),
  }
  const session = fakeFormalizationSignatureGatewaySession({
    requestId: 'request-1',
    recipientId: 'recipient-1',
    tokenHash: 'flow-hash',
    deviceSecretHash: 'device-hash',
    csrfHash: 'csrf-hash',
    kind: 'flow',
  })
  dependencies.sessionsRepository.findByTokenHash.mockResolvedValue(session)
  dependencies.recipientsRepository.findById.mockResolvedValue(
    fakeFormalizationSignatureRecipient({ id: 'recipient-1', personId: 'person-1' }),
  )
  dependencies.invitationsRepository.findConsumedByRecipientAndRequest.mockResolvedValue(
    fakeFormalizationSignatureInvitation({
      id: 'invitation-1',
      requestId: 'request-1',
      recipientId: 'recipient-1',
      status: 'consumed',
      generation: 1,
    }),
  )
  dependencies.sourceReader.listConsentedAuthenticationChannels.mockResolvedValue([
    { id: 'email-choice', kind: 'email', maskedDestination: 'a***@example.com' },
  ])
  dependencies.challengesRepository.findCurrentByInvitationId.mockResolvedValue(null)
  dependencies.challengesRepository.findLatestByInvitationId.mockResolvedValue(null)
  dependencies.guardsRepository.findByInvitationId.mockResolvedValue(null)
  dependencies.reservationsRepository.countByInvitationIdSince.mockResolvedValue(0)
  dependencies.reservationsRepository.countBySourceIpHashSince.mockResolvedValue(0)
  dependencies.cipher.encrypt.mockResolvedValue({
    ciphertext: 'encrypted-code',
    keyId: 'key-1',
  })
  dependencies.idProvider.generate.mockReturnValue('generated-id')
  dependencies.datetimeProvider.now.mockReturnValue(NOW)
  dependencies.transaction.issueOtp.mockResolvedValue('issued')
  dependencies.hasher.hash.mockImplementation((value) => `${value}-hash`)
  dependencies.macProvider.create.mockImplementation(({ code }) => `mac-${code}`)
  dependencies.broker.publish.mockResolvedValue()
  return dependencies
}

function request() {
  return {
    flowToken: 'flow',
    deviceToken: 'device',
    csrfToken: 'csrf',
    channelChoiceId: 'email-choice',
    sourceIpHash: 'ip-hash',
  }
}

describe('Request Signature Otp Use Case', () => {
  it('supersedes the previous challenge and issues only the newest generation', async () => {
    const dependencies = makeDependencies()
    dependencies.challengesRepository.findCurrentByInvitationId.mockResolvedValue({
      id: 'old-challenge',
      invitationId: 'invitation-1',
      generation: 3,
      codeMac: 'old-mac',
      channelChoiceId: 'email-choice',
      destinationFingerprint: 'fingerprint',
      status: 'active',
      failedAttempts: 0,
      issuedAt: NOW,
      expiresAt: new Date(NOW.getTime() + 1000),
    })
    dependencies.challengesRepository.findLatestByInvitationId.mockResolvedValue({
      id: 'old-challenge',
      invitationId: 'invitation-1',
      generation: 3,
      codeMac: 'old-mac',
      channelChoiceId: 'email-choice',
      destinationFingerprint: 'fingerprint',
      status: 'active',
      failedAttempts: 0,
      issuedAt: NOW,
      expiresAt: new Date(NOW.getTime() + 1000),
    })
    const useCase = new RequestSignatureOtpUseCase({
      ...dependencies,
      secretGenerator: { generate: () => '123456', generateNumeric: () => '123456' },
    })
    const result = await useCase.execute(request())
    expect(result.expiresAt.getTime()).toBe(NOW.getTime() + 30 * 60_000)
    expect(
      dependencies.invitationsRepository.findConsumedByRecipientAndRequest,
    ).toHaveBeenCalledWith({ recipientId: 'recipient-1', requestId: 'request-1' })
    expect(
      dependencies.sourceReader.listConsentedAuthenticationChannels,
    ).toHaveBeenCalledWith('person-1')
    expect(dependencies.guardsRepository.findByInvitationId).toHaveBeenCalledWith(
      'invitation-1',
    )
    expect(
      dependencies.challengesRepository.findCurrentByInvitationId,
    ).toHaveBeenCalledWith('invitation-1')
    expect(
      dependencies.challengesRepository.findLatestByInvitationId,
    ).toHaveBeenCalledWith('invitation-1')
    expect(dependencies.transaction.issueOtp).toHaveBeenCalledWith(
      expect.objectContaining({
        invitationId: 'invitation-1',
        expectedInvitationGeneration: 1,
        previousChallengeId: 'old-challenge',
        previousChallengeChanges: { status: 'superseded' },
        challenge: expect.objectContaining({ invitationId: 'invitation-1' }),
        rateReservation: expect.objectContaining({ invitationId: 'invitation-1' }),
      }),
    )
    expect(dependencies.broker.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ invitationId: 'invitation-1' }),
      }),
    )
  })

  it('continues generation after a consumed challenge when no current challenge exists', async () => {
    const dependencies = makeDependencies()
    dependencies.challengesRepository.findLatestByInvitationId.mockResolvedValue({
      id: 'consumed-challenge',
      invitationId: 'invitation-1',
      generation: 4,
      codeMac: 'old-mac',
      channelChoiceId: 'email-choice',
      destinationFingerprint: 'fingerprint',
      status: 'consumed',
      failedAttempts: 0,
      issuedAt: NOW,
      consumedAt: NOW,
    })
    const useCase = new RequestSignatureOtpUseCase({
      ...dependencies,
      secretGenerator: { generate: () => '123456', generateNumeric: () => '123456' },
    })

    await useCase.execute(request())

    expect(dependencies.transaction.issueOtp).toHaveBeenCalledWith(
      expect.objectContaining({
        previousChallengeId: undefined,
        previousChallengeChanges: undefined,
        challenge: expect.objectContaining({ generation: 5 }),
      }),
    )
  })

  it('rejects a resend inside the sixty-second cooldown without publishing work', async () => {
    const dependencies = makeDependencies()
    dependencies.guardsRepository.findByInvitationId.mockResolvedValue({
      invitationId: 'invitation-1',
      failedAttempts: 0,
      rollingWindowStartedAt: NOW,
      sendsInWindow: 1,
      lastSentAt: new Date(NOW.getTime() - 59_000),
      updatedAt: NOW,
      version: 1,
    })
    const useCase = new RequestSignatureOtpUseCase({
      ...dependencies,
      secretGenerator: { generate: () => '123456', generateNumeric: () => '123456' },
    })
    await expect(useCase.execute(request())).rejects.toThrow()
    expect(dependencies.transaction.issueOtp).not.toHaveBeenCalled()
  })

  it('allows a resend at the exact cooldown boundary and keeps the rolling window anchored', async () => {
    const dependencies = makeDependencies()
    dependencies.guardsRepository.findByInvitationId.mockResolvedValue({
      invitationId: 'invitation-1',
      failedAttempts: 0,
      rollingWindowStartedAt: new Date(NOW.getTime() - 5 * 60_000),
      sendsInWindow: 1,
      lastSentAt: new Date(NOW.getTime() - 60_000),
      updatedAt: NOW,
      version: 4,
    })
    const useCase = new RequestSignatureOtpUseCase({
      ...dependencies,
      secretGenerator: { generate: () => '123456', generateNumeric: () => '123456' },
    })

    await useCase.execute(request())

    expect(dependencies.transaction.issueOtp).toHaveBeenCalledWith(
      expect.objectContaining({
        expectedGuardVersion: 4,
        expectedInvitationSendCount: 1,
        expectedSourceIpSendCount: 0,
        guardChanges: expect.objectContaining({
          rollingWindowStartedAt: new Date(NOW.getTime() - 5 * 60_000),
          sendsInWindow: 1,
          lastSentAt: NOW,
        }),
      }),
    )
    expect(dependencies.broker.publish).toHaveBeenCalledTimes(1)
  })

  it('starts a new rolling window while matching the persisted previous-window guard count', async () => {
    const dependencies = makeDependencies()
    dependencies.guardsRepository.findByInvitationId.mockResolvedValue({
      invitationId: 'invitation-1',
      failedAttempts: 0,
      rollingWindowStartedAt: new Date(NOW.getTime() - 30 * 60_000),
      sendsInWindow: 4,
      lastSentAt: new Date(NOW.getTime() - 2 * 60_000),
      updatedAt: NOW,
      version: 6,
    })
    const useCase = new RequestSignatureOtpUseCase({
      ...dependencies,
      secretGenerator: { generate: () => '123456', generateNumeric: () => '123456' },
    })

    await useCase.execute(request())

    expect(dependencies.transaction.issueOtp).toHaveBeenCalledWith(
      expect.objectContaining({
        expectedGuardVersion: 6,
        expectedInvitationSendCount: 4,
        guardChanges: expect.objectContaining({
          rollingWindowStartedAt: NOW,
          sendsInWindow: 1,
        }),
      }),
    )
  })

  it.each([
    ['invitation', { invitationCount: 5, sourceIpCount: 0 }],
    ['source IP', { invitationCount: 0, sourceIpCount: 20 }],
  ])('rejects when the %s rolling limit is exhausted without reserving another send', async (_label, counts) => {
    const dependencies = makeDependencies()
    dependencies.reservationsRepository.countByInvitationIdSince.mockResolvedValue(
      counts.invitationCount,
    )
    dependencies.reservationsRepository.countBySourceIpHashSince.mockResolvedValue(
      counts.sourceIpCount,
    )
    const useCase = new RequestSignatureOtpUseCase({
      ...dependencies,
      secretGenerator: { generate: () => '123456', generateNumeric: () => '123456' },
    })

    await expect(useCase.execute(request())).rejects.toThrow()

    expect(dependencies.transaction.issueOtp).not.toHaveBeenCalled()
    expect(dependencies.broker.publish).not.toHaveBeenCalled()
  })

  it('rejects a locked invitation until the injected clock reaches the lock boundary', async () => {
    const dependencies = makeDependencies()
    dependencies.guardsRepository.findByInvitationId.mockResolvedValue({
      invitationId: 'invitation-1',
      failedAttempts: 5,
      rollingWindowStartedAt: NOW,
      sendsInWindow: 1,
      lockedUntil: new Date(NOW.getTime() + 1),
      updatedAt: NOW,
      version: 2,
    })
    const useCase = new RequestSignatureOtpUseCase({
      ...dependencies,
      secretGenerator: { generate: () => '123456', generateNumeric: () => '123456' },
    })

    await expect(useCase.execute(request())).rejects.toThrow()
    expect(dependencies.transaction.issueOtp).not.toHaveBeenCalled()

    dependencies.guardsRepository.findByInvitationId.mockResolvedValue({
      invitationId: 'invitation-1',
      failedAttempts: 5,
      rollingWindowStartedAt: NOW,
      sendsInWindow: 1,
      lockedUntil: NOW,
      updatedAt: NOW,
      version: 2,
    })
    await useCase.execute(request())
    expect(dependencies.transaction.issueOtp).toHaveBeenCalledTimes(1)
  })

  it('publishes no delivery event when the transactional issue loses a concurrent race', async () => {
    const dependencies = makeDependencies()
    dependencies.transaction.issueOtp.mockResolvedValue('conflict')
    const useCase = new RequestSignatureOtpUseCase({
      ...dependencies,
      secretGenerator: { generate: () => '123456', generateNumeric: () => '123456' },
    })

    await expect(useCase.execute(request())).rejects.toThrow()

    expect(dependencies.broker.publish).not.toHaveBeenCalled()
  })

  it('fails closed when the flow recipient is missing', async () => {
    const dependencies = makeDependencies()
    dependencies.recipientsRepository.findById.mockResolvedValue(null)
    const useCase = new RequestSignatureOtpUseCase({
      ...dependencies,
      secretGenerator: { generate: () => '123456', generateNumeric: () => '123456' },
    })

    await expect(useCase.execute(request())).rejects.toThrow()

    expect(
      dependencies.invitationsRepository.findConsumedByRecipientAndRequest,
    ).not.toHaveBeenCalled()
    expect(
      dependencies.sourceReader.listConsentedAuthenticationChannels,
    ).not.toHaveBeenCalled()
    expect(dependencies.transaction.issueOtp).not.toHaveBeenCalled()
  })
})
