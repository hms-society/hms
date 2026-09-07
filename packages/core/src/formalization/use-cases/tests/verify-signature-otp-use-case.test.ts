import { describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import { VerifySignatureOtpUseCase } from '../verify-signature-otp-use-case'
import {
  fakeFormalizationSignatureGatewaySession,
  fakeFormalizationSignatureInvitation,
  fakeFormalizationSignatureOtpChallenge,
  fakeFormalizationSignatureRecipient,
  fakeFormalizationSignatureRequest,
} from '../../domain/entities/fakers'
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
} from '../../interfaces'
import type { DatetimeProvider, IdProvider } from '../../../shared/interfaces'

const NOW = new Date('2026-01-01T12:00:00.000Z')
type Dependencies = {
  sessionsRepository: MockProxy<FormalizationSignatureGatewaySessionsRepository>
  invitationsRepository: MockProxy<FormalizationSignatureInvitationsRepository>
  challengesRepository: MockProxy<FormalizationSignatureOtpChallengesRepository>
  guardsRepository: MockProxy<FormalizationSignatureOtpGuardsRepository>
  recipientsRepository: MockProxy<FormalizationSignatureRecipientsRepository>
  requestsRepository: MockProxy<FormalizationSignatureRequestsRepository>
  transaction: MockProxy<FormalizationSignatureGatewayTransaction>
  idProvider: MockProxy<IdProvider>
  datetimeProvider: MockProxy<DatetimeProvider>
  verifier: MockProxy<SignatureSecretVerifier>
  hasher: MockProxy<SignatureSecretHasher>
}
function makeDependencies(
  challengeOverrides: Parameters<typeof fakeFormalizationSignatureOtpChallenge>[0] = {},
): Dependencies {
  const dependencies = {
    sessionsRepository: mock<FormalizationSignatureGatewaySessionsRepository>(),
    invitationsRepository: mock<FormalizationSignatureInvitationsRepository>(),
    challengesRepository: mock<FormalizationSignatureOtpChallengesRepository>(),
    guardsRepository: mock<FormalizationSignatureOtpGuardsRepository>(),
    recipientsRepository: mock<FormalizationSignatureRecipientsRepository>(),
    requestsRepository: mock<FormalizationSignatureRequestsRepository>(),
    transaction: mock<FormalizationSignatureGatewayTransaction>(),
    idProvider: mock<IdProvider>(),
    datetimeProvider: mock<DatetimeProvider>(),
    verifier: mock<SignatureSecretVerifier>(),
    hasher: mock<SignatureSecretHasher>(),
  }
  dependencies.sessionsRepository.findByTokenHash.mockResolvedValue(
    fakeFormalizationSignatureGatewaySession({
      requestId: 'request-1',
      tokenHash: 'flow-hash',
      deviceSecretHash: 'device-hash',
      csrfHash: 'csrf-hash',
      kind: 'flow',
      recipientId: 'recipient-1',
    }),
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
  dependencies.recipientsRepository.findById.mockResolvedValue(
    fakeFormalizationSignatureRecipient({
      id: 'recipient-1',
      requestId: 'request-1',
      status: 'invited',
      version: 2,
    }),
  )
  dependencies.requestsRepository.findById.mockResolvedValue(
    fakeFormalizationSignatureRequest({
      id: 'request-1',
      status: 'sending',
      version: 2,
    }),
  )
  dependencies.challengesRepository.findCurrentByInvitationId.mockResolvedValue(
    fakeFormalizationSignatureOtpChallenge({
      id: 'challenge-1',
      invitationId: 'invitation-1',
      status: 'active',
      expiresAt: new Date(NOW.getTime() + 1_000),
      ...challengeOverrides,
    }),
  )
  dependencies.guardsRepository.findByInvitationId.mockResolvedValue({
    invitationId: 'invitation-1',
    failedAttempts: 0,
    rollingWindowStartedAt: NOW,
    sendsInWindow: 1,
    lastSentAt: NOW,
    updatedAt: NOW,
    version: 1,
  })
  dependencies.transaction.verifyOtp.mockResolvedValue('applied')
  dependencies.idProvider.generate.mockReturnValue('generated')
  dependencies.datetimeProvider.now.mockReturnValue(NOW)
  dependencies.hasher.hash.mockImplementation((value) => `${value}-hash`)
  dependencies.verifier.verify.mockReturnValue(false)
  return dependencies
}
function request(code = '123456') {
  return {
    flowToken: 'flow',
    deviceToken: 'device',
    csrfToken: 'csrf',
    challengeId: 'challenge-1',
    code,
    sourceIpHash: 'ip-hash',
  }
}
describe('Verify Signature Otp Use Case', () => {
  it('does not invoke the verifier after the challenge expires', async () => {
    const dependencies = makeDependencies({ expiresAt: new Date(NOW.getTime() - 1) })
    const useCase = new VerifySignatureOtpUseCase({
      ...dependencies,
      secretGenerator: { generate: () => 'secret' },
    })
    await expect(useCase.execute(request())).rejects.toThrow()
    expect(dependencies.verifier.verify).not.toHaveBeenCalled()
  })
  it('locks after the fifth failed attempt and updates the guard atomically', async () => {
    const dependencies = makeDependencies({ failedAttempts: 4 })
    const useCase = new VerifySignatureOtpUseCase({
      ...dependencies,
      secretGenerator: { generate: () => 'secret' },
    })
    await expect(useCase.execute(request())).rejects.toThrow()
    expect(dependencies.transaction.verifyOtp).toHaveBeenCalledWith(
      expect.objectContaining({
        invitationId: 'invitation-1',
        challengeChanges: { failedAttempts: 5 },
        guardChanges: expect.objectContaining({
          failedAttempts: 5,
          lockedUntil: new Date(NOW.getTime() + 15 * 60_000),
        }),
      }),
    )
  })
  it('uses the injected constant-time verifier exactly once for a valid ASCII code', async () => {
    const dependencies = makeDependencies()
    dependencies.verifier.verify.mockReturnValue(true)
    const useCase = new VerifySignatureOtpUseCase({
      ...dependencies,
      secretGenerator: { generate: () => 'secret' },
    })
    await useCase.execute(request())
    expect(dependencies.verifier.verify).toHaveBeenCalledTimes(1)
    expect(dependencies.verifier.verify).toHaveBeenCalledWith({
      secret: '123456',
      verifier: expect.any(String),
    })
  })
  it('recovers a client whose provider observation advanced to signing', async () => {
    const dependencies = makeDependencies()
    dependencies.recipientsRepository.findById.mockResolvedValue(
      fakeFormalizationSignatureRecipient({
        id: 'recipient-1',
        requestId: 'request-1',
        status: 'signing',
        version: 2,
      }),
    )
    dependencies.verifier.verify.mockReturnValue(true)
    const useCase = new VerifySignatureOtpUseCase({
      ...dependencies,
      secretGenerator: { generate: () => 'secret' },
    })

    await expect(useCase.execute(request())).resolves.toBeDefined()
    expect(dependencies.transaction.verifyOtp).toHaveBeenCalledWith(
      expect.objectContaining({ recipientChanges: { status: 'authenticated' } }),
    )
  })
  it('rejects a superseded challenge without consuming it', async () => {
    const dependencies = makeDependencies({ status: 'superseded' })
    const useCase = new VerifySignatureOtpUseCase({
      ...dependencies,
      secretGenerator: { generate: () => 'secret' },
    })
    await expect(useCase.execute(request())).rejects.toThrow()
    expect(dependencies.transaction.verifyOtp).not.toHaveBeenCalled()
  })
  it('rejects at the exact challenge expiry boundary without invoking the verifier', async () => {
    const dependencies = makeDependencies({ expiresAt: NOW })
    const useCase = new VerifySignatureOtpUseCase({
      ...dependencies,
      secretGenerator: { generate: () => 'secret' },
    })
    await expect(useCase.execute(request())).rejects.toThrow()
    expect(dependencies.verifier.verify).not.toHaveBeenCalled()
  })
  it('increments a failed attempt without locking before the fifth failure', async () => {
    const dependencies = makeDependencies({ failedAttempts: 3 })
    const useCase = new VerifySignatureOtpUseCase({
      ...dependencies,
      secretGenerator: { generate: () => 'secret' },
    })
    await expect(useCase.execute(request())).rejects.toThrow()
    expect(dependencies.transaction.verifyOtp).toHaveBeenCalledWith(
      expect.objectContaining({
        challengeChanges: { failedAttempts: 4 },
        guardChanges: { failedAttempts: 4, lockedUntil: undefined, updatedAt: NOW },
      }),
    )
  })
  it('rotates the flow session atomically and consumes the active challenge with the current guard version', async () => {
    const dependencies = makeDependencies()
    dependencies.guardsRepository.findByInvitationId.mockResolvedValue({
      invitationId: 'invitation-1',
      failedAttempts: 0,
      rollingWindowStartedAt: NOW,
      sendsInWindow: 1,
      lastSentAt: NOW,
      updatedAt: NOW,
      version: 7,
    })
    dependencies.verifier.verify.mockReturnValue(true)
    const useCase = new VerifySignatureOtpUseCase({
      ...dependencies,
      secretGenerator: { generate: () => 'secret' },
    })
    const result = await useCase.execute(request())
    expect(result.expiresAt.getTime()).toBe(
      new Date('2026-01-02T00:00:00.000Z').getTime(),
    )
    expect(
      dependencies.invitationsRepository.findConsumedByRecipientAndRequest,
    ).toHaveBeenCalledWith({ recipientId: 'recipient-1', requestId: 'request-1' })
    expect(
      dependencies.challengesRepository.findCurrentByInvitationId,
    ).toHaveBeenCalledWith('invitation-1')
    expect(dependencies.guardsRepository.findByInvitationId).toHaveBeenCalledWith(
      'invitation-1',
    )
    expect(dependencies.transaction.verifyOtp).toHaveBeenCalledWith(
      expect.objectContaining({
        invitationId: 'invitation-1',
        expectedGuardVersion: 7,
        challengeChanges: { status: 'consumed', consumedAt: NOW },
        flowSessionChanges: {
          status: 'revoked',
          revokedAt: NOW,
          revocationReason: 'rotated',
        },
        authenticatedSession: expect.objectContaining({
          kind: 'authenticated',
          expiresAt: expect.any(Date),
        }),
        recipientId: 'recipient-1',
        expectedRecipientVersion: 2,
        recipientChanges: { status: 'authenticated' },
        requestId: 'request-1',
        expectedRequestVersion: 2,
        requestChanges: { status: 'in_progress' },
      }),
    )
  })
  it('does not mint a session when the transaction loses the one-use verification race', async () => {
    const dependencies = makeDependencies()
    dependencies.verifier.verify.mockReturnValue(true)
    dependencies.transaction.verifyOtp.mockResolvedValue('conflict')
    const useCase = new VerifySignatureOtpUseCase({
      ...dependencies,
      secretGenerator: { generate: () => 'secret' },
    })
    await expect(useCase.execute(request())).rejects.toThrow()
    expect(dependencies.transaction.verifyOtp).toHaveBeenCalledTimes(1)
  })
  it('rejects an expired flow session before reading or verifying an OTP', async () => {
    const dependencies = makeDependencies()
    dependencies.sessionsRepository.findByTokenHash.mockResolvedValue(
      fakeFormalizationSignatureGatewaySession({
        tokenHash: 'flow-hash',
        deviceSecretHash: 'device-hash',
        csrfHash: 'csrf-hash',
        kind: 'flow',
        recipientId: 'recipient-1',
        expiresAt: new Date(NOW.getTime() - 1),
      }),
    )
    const useCase = new VerifySignatureOtpUseCase({
      ...dependencies,
      secretGenerator: { generate: () => 'secret' },
    })
    await expect(useCase.execute(request())).rejects.toThrow()
    expect(
      dependencies.challengesRepository.findCurrentByInvitationId,
    ).not.toHaveBeenCalled()
    expect(dependencies.verifier.verify).not.toHaveBeenCalled()
  })
  it('fails closed when the invitation does not belong to the flow recipient', async () => {
    const dependencies = makeDependencies()
    dependencies.invitationsRepository.findConsumedByRecipientAndRequest.mockResolvedValue(
      fakeFormalizationSignatureInvitation({
        id: 'invitation-1',
        requestId: 'request-1',
        recipientId: 'different-recipient',
        status: 'consumed',
      }),
    )
    const useCase = new VerifySignatureOtpUseCase({
      ...dependencies,
      secretGenerator: { generate: () => 'secret' },
    })
    await expect(useCase.execute(request())).rejects.toThrow()
    expect(
      dependencies.challengesRepository.findCurrentByInvitationId,
    ).not.toHaveBeenCalled()
    expect(dependencies.transaction.verifyOtp).not.toHaveBeenCalled()
  })
  it('fails closed when the current invitation guard is missing', async () => {
    const dependencies = makeDependencies()
    dependencies.guardsRepository.findByInvitationId.mockResolvedValue(null)
    dependencies.verifier.verify.mockReturnValue(true)
    const useCase = new VerifySignatureOtpUseCase({
      ...dependencies,
      secretGenerator: { generate: () => 'secret' },
    })
    await expect(useCase.execute(request())).rejects.toThrow()
    expect(dependencies.verifier.verify).not.toHaveBeenCalled()
    expect(dependencies.transaction.verifyOtp).not.toHaveBeenCalled()
  })
})
