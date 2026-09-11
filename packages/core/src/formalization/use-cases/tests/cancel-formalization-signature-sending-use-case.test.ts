import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import { CancelFormalizationSignatureSendingUseCase } from '../cancel-formalization-signature-sending-use-case'
import { fakeFormalizationSignatureRequest } from '../../domain/entities/fakers'
import type {
  FormalizationSignatureGatewayTransaction,
  FormalizationSignatureRequestsRepository,
  FormalizationSignatureRecipientsRepository,
  FormalizationSignatureCancellationAttemptsRepository,
  FormalizationSignatureInvitationsRepository,
  FormalizationSignatureGatewaySessionsRepository,
  FormalizationSignatureProxyBindingsRepository,
} from '../../interfaces'
import type { Broker, DatetimeProvider, IdProvider } from '../../../shared/interfaces'

describe('Cancel Formalization Signature Sending Use Case', () => {
  it('requests cancellation once at request scope', async () => {
    const requests = mock<FormalizationSignatureRequestsRepository>()
    const transaction = mock<FormalizationSignatureGatewayTransaction>()
    const request = fakeFormalizationSignatureRequest({
      id: 'request-1',
      status: 'sending',
      formalizationId: 'formalization-1',
    })
    requests.findById.mockResolvedValue(request)
    transaction.requestCancellation.mockResolvedValue('applied')
    const useCase = new CancelFormalizationSignatureSendingUseCase({
      requestsRepository: requests,
      recipientsRepository: mock<FormalizationSignatureRecipientsRepository>(),
      cancellationsRepository:
        mock<FormalizationSignatureCancellationAttemptsRepository>(),
      invitationsRepository: mock<FormalizationSignatureInvitationsRepository>(),
      sessionsRepository: mock<FormalizationSignatureGatewaySessionsRepository>(),
      bindingsRepository: mock<FormalizationSignatureProxyBindingsRepository>(),
      transaction,
      idProvider: { generate: () => 'id' } as IdProvider,
      datetimeProvider: { now: () => new Date() } as DatetimeProvider,
      broker: mock<Broker>(),
    })
    await expect(
      useCase.execute({
        requestId: 'request-1',
        actorId: 'actor-1',
        reason: 'Cliente solicitou cancelamento',
        expectedRequestVersion: request.version,
        expectedFormalizationVersion: 9,
      }),
    ).resolves.toMatchObject({ outcome: 'scheduled', cancellationPending: true })
    expect(transaction.requestCancellation).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'request-1',
        expectedRequestVersion: request.version,
        expectedFormalizationVersion: 9,
        cancellationAttempt: expect.objectContaining({ requestId: 'request-1' }),
      }),
    )
  })

  it('rejects a blank cancellation reason before loading or mutating state', async () => {
    const requests = mock<FormalizationSignatureRequestsRepository>()
    const transaction = mock<FormalizationSignatureGatewayTransaction>()
    const useCase = new CancelFormalizationSignatureSendingUseCase({
      requestsRepository: requests,
      recipientsRepository: mock<FormalizationSignatureRecipientsRepository>(),
      cancellationsRepository: mock<FormalizationSignatureCancellationAttemptsRepository>(),
      invitationsRepository: mock<FormalizationSignatureInvitationsRepository>(),
      sessionsRepository: mock<FormalizationSignatureGatewaySessionsRepository>(),
      bindingsRepository: mock<FormalizationSignatureProxyBindingsRepository>(),
      transaction,
      idProvider: { generate: () => 'id' },
      datetimeProvider: { now: () => new Date() },
      broker: mock<Broker>(),
    })
    await expect(useCase.execute({
      requestId: 'request-1', actorId: 'actor-1', expectedRequestVersion: 1,
      expectedFormalizationVersion: 1, reason: '   ',
    })).rejects.toThrow()
    expect(requests.findById).not.toHaveBeenCalled()
    expect(transaction.requestCancellation).not.toHaveBeenCalled()
  })
})
