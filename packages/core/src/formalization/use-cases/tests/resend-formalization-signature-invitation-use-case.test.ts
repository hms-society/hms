import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import { fakeFormalization } from '../../domain/entities/fakers/formalization-faker'
import { fakeFormalizationSignatureInvitation } from '../../domain/entities/fakers/formalization-signature-invitation-faker'
import { fakeFormalizationSignatureRecipient } from '../../domain/entities/fakers/formalization-signature-recipient-faker'
import { fakeFormalizationSignatureRequest } from '../../domain/entities/fakers/formalization-signature-request-faker'
import {
  FormalizationSignatureChannelUnavailableError,
  FormalizationSignatureRequestConflictError,
} from '../../domain/errors'
import type {
  FormalizationSignatureGatewaySessionsRepository,
  FormalizationSignatureInvitationResendTransaction,
  FormalizationSignatureInvitationsRepository,
  FormalizationSignatureProxyBindingsRepository,
  FormalizationSignatureRecipientsRepository,
  FormalizationSignatureRequestsRepository,
  FormalizationSignatureSourceReader,
  FormalizationsRepository,
  SensitivePayloadCipherProvider,
  SignatureSecretHasher,
} from '../../interfaces'
import type { Broker, DatetimeProvider, IdProvider } from '../../../shared/interfaces'
import { ResendFormalizationSignatureInvitationUseCase } from '../resend-formalization-signature-invitation-use-case'

describe('Resend Formalization Signature Invitation Use Case', () => {
  function setup() {
    const formalizationsRepository = mock<FormalizationsRepository>()
    const requestsRepository = mock<FormalizationSignatureRequestsRepository>()
    const recipientsRepository = mock<FormalizationSignatureRecipientsRepository>()
    const invitationsRepository = mock<FormalizationSignatureInvitationsRepository>()
    const sessionsRepository = mock<FormalizationSignatureGatewaySessionsRepository>()
    const bindingsRepository = mock<FormalizationSignatureProxyBindingsRepository>()
    const sourceReader = mock<FormalizationSignatureSourceReader>()
    const transaction = mock<FormalizationSignatureInvitationResendTransaction>()
    const cipher = mock<SensitivePayloadCipherProvider>()
    const hasher = mock<SignatureSecretHasher>()
    const datetimeProvider = mock<DatetimeProvider>()
    const idProvider = mock<IdProvider>()
    const broker = mock<Broker>()
    datetimeProvider.now.mockReturnValue(new Date('2026-09-01T10:00:00.000Z'))
    idProvider.generate
      .mockReturnValueOnce('invitation-2')
      .mockReturnValueOnce('attempt-2')
    cipher.encrypt.mockResolvedValue({ ciphertext: 'encrypted', keyId: 'key-1' })
    hasher.hash.mockReturnValue('hash')
    const useCase = new ResendFormalizationSignatureInvitationUseCase({
      formalizationsRepository,
      requestsRepository,
      recipientsRepository,
      invitationsRepository,
      sessionsRepository,
      bindingsRepository,
      sourceReader,
      transaction,
      cipher,
      hasher,
      secretGenerator: { generate: () => 'secret' },
      datetimeProvider,
      idProvider,
      broker,
    })
    return {
      useCase,
      formalizationsRepository,
      requestsRepository,
      recipientsRepository,
      invitationsRepository,
      sessionsRepository,
      bindingsRepository,
      sourceReader,
      transaction,
      broker,
      cipher,
    }
  }

  it.each([
    'reading',
    'reconciliation_required',
  ] as const)('rotates access once for the %s state and publishes delivery only after the transaction', async (recipientStatus) => {
    const state = setup()
    const formalization = fakeFormalization()
    const request = fakeFormalizationSignatureRequest({
      id: 'request-1',
      formalizationId: formalization.id,
    })
    const recipient = fakeFormalizationSignatureRecipient({
      id: 'recipient-1',
      requestId: request.id,
      personId: 'person-1',
      deliveryChannel: 'email',
      status: recipientStatus,
      version: 3,
    })
    const previous = fakeFormalizationSignatureInvitation({
      id: 'invitation-1',
      requestId: request.id,
      recipientId: recipient.id,
      generation: 4,
    })
    state.formalizationsRepository.findById.mockResolvedValue(formalization)
    state.requestsRepository.findCurrentByFormalizationId.mockResolvedValue(request)
    state.recipientsRepository.findById.mockResolvedValue(recipient)
    state.invitationsRepository.findLatestByRecipientId.mockResolvedValue(previous)
    state.sourceReader.findPerson.mockResolvedValue({
      personId: recipient.personId,
      name: recipient.displayNameSnapshot,
      email: 'a@example.com',
      availableChannels: ['email'],
    })
    state.sessionsRepository.findActiveByRecipientId.mockResolvedValue([])
    state.bindingsRepository.findActiveByRecipientId.mockResolvedValue([])
    state.transaction.resend.mockResolvedValue('applied')

    await expect(
      state.useCase.execute({
        formalizationId: formalization.id,
        recipientId: recipient.id,
        actorId: formalization.assignedLawyerId,
        expectedRecipientVersion: recipient.version,
        expectedInvitationGeneration: previous.generation,
      }),
    ).resolves.toEqual({
      requestId: request.id,
      recipientId: recipient.id,
      invitationId: 'invitation-2',
      generation: 5,
      deliveryPending: true,
    })
    expect(state.transaction.resend).toHaveBeenCalledWith(
      expect.objectContaining({
        previousInvitationId: previous.id,
        expectedInvitationGeneration: previous.generation,
        invitation: expect.objectContaining({ generation: 5, status: 'active' }),
        sendAttempt: expect.objectContaining({ status: 'pending' }),
      }),
    )
    expect(state.cipher.encrypt).toHaveBeenCalledWith(
      expect.objectContaining({
        plaintext: new TextEncoder().encode(JSON.stringify({ token: 'secret' })),
        contextId: 'invitation-2',
        purpose: 'invitation_delivery',
      }),
    )
    expect(state.broker.publish).toHaveBeenCalledOnce()
  })

  it('rejects the signing state without rotating access', async () => {
    const state = setup()
    const formalization = fakeFormalization()
    const request = fakeFormalizationSignatureRequest({
      formalizationId: formalization.id,
    })
    const recipient = fakeFormalizationSignatureRecipient({
      requestId: request.id,
      status: 'signing',
      version: 2,
    })
    const invitation = fakeFormalizationSignatureInvitation({
      recipientId: recipient.id,
      generation: 1,
    })
    state.formalizationsRepository.findById.mockResolvedValue(formalization)
    state.requestsRepository.findCurrentByFormalizationId.mockResolvedValue(request)
    state.recipientsRepository.findById.mockResolvedValue(recipient)
    state.invitationsRepository.findLatestByRecipientId.mockResolvedValue(invitation)

    await expect(
      state.useCase.execute({
        formalizationId: formalization.id,
        recipientId: recipient.id,
        actorId: formalization.assignedLawyerId,
        expectedRecipientVersion: recipient.version,
        expectedInvitationGeneration: invitation.generation,
      }),
    ).rejects.toBeInstanceOf(FormalizationSignatureRequestConflictError)
    expect(state.transaction.resend).not.toHaveBeenCalled()
  })

  it('rejects stale rotation and missing channel consent without mutation', async () => {
    const state = setup()
    const formalization = fakeFormalization()
    const request = fakeFormalizationSignatureRequest({
      formalizationId: formalization.id,
    })
    const recipient = fakeFormalizationSignatureRecipient({
      requestId: request.id,
      status: 'invited',
      version: 2,
    })
    const invitation = fakeFormalizationSignatureInvitation({
      recipientId: recipient.id,
      generation: 1,
    })
    state.formalizationsRepository.findById.mockResolvedValue(formalization)
    state.requestsRepository.findCurrentByFormalizationId.mockResolvedValue(request)
    state.recipientsRepository.findById.mockResolvedValue(recipient)
    state.invitationsRepository.findLatestByRecipientId.mockResolvedValue(invitation)
    state.sourceReader.findPerson.mockResolvedValue({
      personId: recipient.personId,
      name: recipient.displayNameSnapshot,
      availableChannels: [],
    })
    await expect(
      state.useCase.execute({
        formalizationId: formalization.id,
        recipientId: recipient.id,
        actorId: formalization.assignedLawyerId,
        expectedRecipientVersion: 1,
        expectedInvitationGeneration: 1,
      }),
    ).rejects.toBeInstanceOf(FormalizationSignatureRequestConflictError)
    await expect(
      state.useCase.execute({
        formalizationId: formalization.id,
        recipientId: recipient.id,
        actorId: formalization.assignedLawyerId,
        expectedRecipientVersion: 2,
        expectedInvitationGeneration: 1,
      }),
    ).rejects.toBeInstanceOf(FormalizationSignatureChannelUnavailableError)
    expect(state.transaction.resend).not.toHaveBeenCalled()
  })
})
