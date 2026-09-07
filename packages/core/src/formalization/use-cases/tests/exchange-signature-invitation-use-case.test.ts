import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import { ExchangeSignatureInvitationUseCase } from '../exchange-signature-invitation-use-case'
import type { DatetimeProvider, IdProvider } from '../../../shared/interfaces'
import {
  fakeFormalizationSignatureInvitation,
  fakeFormalizationSignatureRecipient,
  fakeFormalizationSignatureRequest,
} from '../../domain/entities/fakers'
import type {
  FormalizationSignatureGatewayTransaction,
  FormalizationSignatureGatewaySessionsRepository,
  FormalizationSignatureInvitationsRepository,
  FormalizationSignatureRequestsRepository,
  FormalizationSignatureRecipientsRepository,
  SignatureSecretHasher,
} from '../../interfaces'

describe('Exchange Signature Invitation Use Case', () => {
  it.each([
    { actorKind: 'client' as const, consumesAtExchange: true },
    { actorKind: 'collaborator' as const, consumesAtExchange: false },
  ])('creates a flow and sets invitation consumption for $actorKind to $consumesAtExchange', async ({
    actorKind,
    consumesAtExchange,
  }) => {
    const invitationsRepository = mock<FormalizationSignatureInvitationsRepository>()
    const sessionsRepository = mock<FormalizationSignatureGatewaySessionsRepository>()
    const requestsRepository = mock<FormalizationSignatureRequestsRepository>()
    const recipientsRepository = mock<FormalizationSignatureRecipientsRepository>()
    const transaction = mock<FormalizationSignatureGatewayTransaction>()
    const idProvider = mock<IdProvider>()
    const datetimeProvider = mock<DatetimeProvider>()
    const hasher = mock<SignatureSecretHasher>()
    const now = new Date('2026-09-04T12:00:00.000Z')
    const expiresAt = new Date('2026-09-11T12:00:00.000Z')
    invitationsRepository.findByTokenHash.mockResolvedValue(
      fakeFormalizationSignatureInvitation({
        id: 'invitation-1',
        requestId: 'request-1',
        recipientId: 'recipient-1',
        status: 'active',
        generation: 1,
        expiresAt,
      }),
    )
    requestsRepository.findById.mockResolvedValue(
      fakeFormalizationSignatureRequest({
        id: 'request-1',
        snapshotId: 'snapshot-1',
      }),
    )
    recipientsRepository.findById.mockResolvedValue(
      fakeFormalizationSignatureRecipient({
        id: 'recipient-1',
        requestId: 'request-1',
        actorKind,
      }),
    )
    sessionsRepository.findActiveByRecipientId.mockResolvedValue([])
    transaction.exchangeInvitation.mockResolvedValue('applied')
    datetimeProvider.now.mockReturnValue(now)
    idProvider.generate.mockReturnValue('flow-session')
    hasher.hash.mockImplementation((value) => `hash:${value}`)
    const secrets = ['flow-token', 'device-token', 'csrf-token']
    const useCase = new ExchangeSignatureInvitationUseCase({
      invitationsRepository,
      sessionsRepository,
      requestsRepository,
      recipientsRepository,
      transaction,
      idProvider,
      datetimeProvider,
      hasher,
      secretGenerator: { generate: () => secrets.shift() ?? 'secret' },
    })

    await useCase.execute({
      token: 'invitation-token',
      origin: 'https://hms.test',
      sourceIpHash: 'ip',
      userAgentHash: 'ua',
    })

    expect(transaction.exchangeInvitation).toHaveBeenCalledWith(
      expect.objectContaining({
        invitationId: 'invitation-1',
        ...(consumesAtExchange
          ? { invitationChanges: { status: 'consumed', consumedAt: now } }
          : {}),
      }),
    )
    if (!consumesAtExchange)
      expect(transaction.exchangeInvitation.mock.calls[0]?.[0]).not.toHaveProperty(
        'invitationChanges',
      )
  })

  it('recovers a collaborator invitation consumed by the previous exchange policy', async () => {
    const invitationsRepository = mock<FormalizationSignatureInvitationsRepository>()
    const sessionsRepository = mock<FormalizationSignatureGatewaySessionsRepository>()
    const requestsRepository = mock<FormalizationSignatureRequestsRepository>()
    const recipientsRepository = mock<FormalizationSignatureRecipientsRepository>()
    const transaction = mock<FormalizationSignatureGatewayTransaction>()
    const datetimeProvider = mock<DatetimeProvider>()
    const hasher = mock<SignatureSecretHasher>()
    const now = new Date('2026-09-04T12:00:00.000Z')
    invitationsRepository.findByTokenHash.mockResolvedValue(
      fakeFormalizationSignatureInvitation({
        id: 'invitation-1',
        requestId: 'request-1',
        recipientId: 'recipient-1',
        status: 'consumed',
        expiresAt: new Date('2026-09-11T12:00:00.000Z'),
      }),
    )
    requestsRepository.findById.mockResolvedValue(
      fakeFormalizationSignatureRequest({ id: 'request-1' }),
    )
    recipientsRepository.findById.mockResolvedValue(
      fakeFormalizationSignatureRecipient({
        id: 'recipient-1',
        requestId: 'request-1',
        actorKind: 'collaborator',
        status: 'invited',
      }),
    )
    sessionsRepository.findActiveByRecipientId.mockResolvedValue([])
    transaction.exchangeInvitation.mockResolvedValue('applied')
    datetimeProvider.now.mockReturnValue(now)
    hasher.hash.mockImplementation((value) => `hash:${value}`)

    await expect(
      new ExchangeSignatureInvitationUseCase({
        invitationsRepository,
        sessionsRepository,
        requestsRepository,
        recipientsRepository,
        transaction,
        idProvider: { generate: () => 'flow-session' },
        datetimeProvider,
        hasher,
        secretGenerator: { generate: () => 'secret' },
      }).execute({
        token: 'invitation-token',
        origin: 'https://hms.test',
        sourceIpHash: 'ip',
        userAgentHash: 'ua',
      }),
    ).resolves.toBeDefined()
    expect(transaction.exchangeInvitation.mock.calls[0]?.[0]).not.toHaveProperty(
      'invitationChanges',
    )
  })

  it.each([
    { actorKind: 'client' as const },
    { actorKind: 'collaborator' as const },
  ])('recovers a consumed $actorKind invitation while its signer is pending', async ({
    actorKind,
  }) => {
    const invitationsRepository = mock<FormalizationSignatureInvitationsRepository>()
    const sessionsRepository = mock<FormalizationSignatureGatewaySessionsRepository>()
    const requestsRepository = mock<FormalizationSignatureRequestsRepository>()
    const recipientsRepository = mock<FormalizationSignatureRecipientsRepository>()
    const transaction = mock<FormalizationSignatureGatewayTransaction>()
    const datetimeProvider = mock<DatetimeProvider>()
    const hasher = mock<SignatureSecretHasher>()
    const now = new Date('2026-09-04T12:00:00.000Z')
    invitationsRepository.findByTokenHash.mockResolvedValue(
      fakeFormalizationSignatureInvitation({
        id: 'invitation-1',
        requestId: 'request-1',
        recipientId: 'recipient-1',
        status: 'consumed',
        expiresAt: new Date('2026-09-11T12:00:00.000Z'),
      }),
    )
    requestsRepository.findById.mockResolvedValue(
      fakeFormalizationSignatureRequest({ id: 'request-1' }),
    )
    recipientsRepository.findById.mockResolvedValue(
      fakeFormalizationSignatureRecipient({
        id: 'recipient-1',
        requestId: 'request-1',
        actorKind,
        status: 'signing',
      }),
    )
    sessionsRepository.findActiveByRecipientId.mockResolvedValue([])
    transaction.exchangeInvitation.mockResolvedValue('applied')
    datetimeProvider.now.mockReturnValue(now)
    hasher.hash.mockImplementation((value) => `hash:${value}`)

    await expect(
      new ExchangeSignatureInvitationUseCase({
        invitationsRepository,
        sessionsRepository,
        requestsRepository,
        recipientsRepository,
        transaction,
        idProvider: { generate: () => 'flow-session' },
        datetimeProvider,
        hasher,
        secretGenerator: { generate: () => 'secret' },
      }).execute({
        token: 'invitation-token',
        origin: 'https://hms.test',
        sourceIpHash: 'ip',
        userAgentHash: 'ua',
      }),
    ).resolves.toBeDefined()
    expect(transaction.exchangeInvitation.mock.calls[0]?.[0]).not.toHaveProperty(
      'invitationChanges',
    )
  })

  it('rejects an unknown invitation without creating a session', async () => {
    const invitationsRepository = mock<FormalizationSignatureInvitationsRepository>()
    const transaction = mock<FormalizationSignatureGatewayTransaction>()
    const hasher = mock<SignatureSecretHasher>()
    hasher.hash.mockImplementation((value) => `hash:${value}`)
    invitationsRepository.findByTokenHash.mockResolvedValue(null)
    const useCase = new ExchangeSignatureInvitationUseCase({
      invitationsRepository,
      sessionsRepository: mock<FormalizationSignatureGatewaySessionsRepository>(),
      requestsRepository: mock<FormalizationSignatureRequestsRepository>(),
      recipientsRepository: mock<FormalizationSignatureRecipientsRepository>(),
      secretGenerator: { generate: () => 'secret' },
      transaction,
      idProvider: mock<IdProvider>(),
      datetimeProvider: mock<DatetimeProvider>(),
      hasher,
    })

    await expect(
      useCase.execute({
        token: 'secret',
        origin: 'https://hms.test',
        sourceIpHash: 'ip',
        userAgentHash: 'ua',
      }),
    ).rejects.toThrow()
    expect(transaction.exchangeInvitation).not.toHaveBeenCalled()
  })
})
