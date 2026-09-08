import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import { MarkSignatureOtpDeliveryUseCase } from '../mark-signature-otp-delivery-use-case'
import { fakeFormalizationSignatureOtpSendAttempt } from '../../domain/entities/fakers'
import type {
  FormalizationSignatureOtpChallengesRepository,
  FormalizationSignatureOtpSendAttemptsRepository,
} from '../../interfaces'

describe('Mark Signature Otp Delivery Use Case', () => {
  it('marks a pending delivery once and ignores a repeated result', async () => {
    const attemptsRepository = mock<FormalizationSignatureOtpSendAttemptsRepository>()
    const challengesRepository = mock<FormalizationSignatureOtpChallengesRepository>()
    const attempt = fakeFormalizationSignatureOtpSendAttempt({
      id: 'attempt-1',
      status: 'pending',
    })
    attemptsRepository.findById
      .mockResolvedValueOnce(attempt)
      .mockResolvedValueOnce({ ...attempt, status: 'delivered' })
    challengesRepository.findById.mockResolvedValue({
      id: attempt.challengeId,
      invitationId: 'invitation-1',
      generation: 1,
      codeMac: 'code-mac',
      channelChoiceId: 'channel-1',
      destinationFingerprint: 'destination',
      status: 'pending_delivery',
      failedAttempts: 0,
      issuedAt: new Date('2026-01-01'),
      expiresAt: new Date('2026-01-02'),
    })
    const useCase = new MarkSignatureOtpDeliveryUseCase({
      attemptsRepository,
      challengesRepository,
    })
    const occurredAt = new Date('2026-01-01')

    await useCase.execute({
      deliveryAttemptId: attempt.id,
      outcome: 'delivered',
      providerMessageId: 'message-1',
      occurredAt,
    })
    await useCase.execute({
      deliveryAttemptId: attempt.id,
      outcome: 'delivered',
      providerMessageId: 'message-1',
      occurredAt,
    })

    expect(attemptsRepository.replace).toHaveBeenCalledTimes(1)
    expect(challengesRepository.findById).toHaveBeenCalledWith(attempt.challengeId)
    expect(attemptsRepository.replace).toHaveBeenCalledWith(
      expect.objectContaining({
        attemptId: attempt.id,
        changes: expect.objectContaining({
          status: 'delivered',
          providerMessageId: 'message-1',
        }),
      }),
    )
    expect(challengesRepository.replace).toHaveBeenCalledWith(
      expect.objectContaining({
        challengeId: attempt.challengeId,
        changes: expect.objectContaining({ status: 'active', sentAt: occurredAt }),
      }),
    )
  })
})
