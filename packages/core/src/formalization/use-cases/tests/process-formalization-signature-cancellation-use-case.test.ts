import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import {
  fakeFormalizationSignatureCancellationAttempt,
  fakeFormalizationSignatureProviderResource,
  fakeFormalizationSignatureRecipient,
  fakeFormalizationSignatureRequest,
  fakeFormalizationSignatureRequestDocument,
} from '../../domain/entities/fakers'
import type {
  FormalizationSignatureCancellationAttemptsRepository,
  FormalizationSignatureGatewayTransaction,
  FormalizationSignatureProviderResourcesRepository,
  FormalizationSignatureRecipientsRepository,
  FormalizationSignatureRequestDocumentsRepository,
  FormalizationSignatureRequestsRepository,
  SignatureProvider,
} from '../../interfaces'
import { ProcessFormalizationSignatureCancellationUseCase } from '../process-formalization-signature-cancellation-use-case'

const NOW = new Date('2026-09-03T00:00:00.000Z')

function makeFixture() {
  const attemptsRepository = mock<FormalizationSignatureCancellationAttemptsRepository>()
  const resourcesRepository = mock<FormalizationSignatureProviderResourcesRepository>()
  const requestsRepository = mock<FormalizationSignatureRequestsRepository>()
  const recipientsRepository = mock<FormalizationSignatureRecipientsRepository>()
  const documentsRepository = mock<FormalizationSignatureRequestDocumentsRepository>()
  const transaction = mock<FormalizationSignatureGatewayTransaction>()
  const provider = mock<SignatureProvider>()
  const attempt = fakeFormalizationSignatureCancellationAttempt({
    id: 'attempt-1',
    requestId: 'request-1',
    attemptToken: 'attempt-token',
    status: 'processing',
    attempts: 1,
    leaseExpiresAt: new Date(NOW.getTime() + 30_000),
  })
  attemptsRepository.findById.mockResolvedValue(attempt)
  attemptsRepository.claim.mockResolvedValue(attempt)
  resourcesRepository.findByRequestId.mockResolvedValue(
    fakeFormalizationSignatureProviderResource({
      requestId: 'request-1',
      providerEnvelopeId: 'envelope-1',
    }),
  )
  requestsRepository.findById.mockResolvedValue(
    fakeFormalizationSignatureRequest({
      id: 'request-1',
      status: 'in_progress',
      version: 4,
    }),
  )
  recipientsRepository.listByRequestId.mockResolvedValue([
    fakeFormalizationSignatureRecipient({
      id: 'recipient-1',
      requestId: 'request-1',
      status: 'signing',
      version: 2,
    }),
    fakeFormalizationSignatureRecipient({
      id: 'recipient-confirmed',
      requestId: 'request-1',
      status: 'confirmed',
      version: 3,
    }),
  ])
  documentsRepository.listByRequestId.mockResolvedValue([
    fakeFormalizationSignatureRequestDocument({
      id: 'document-1',
      requestId: 'request-1',
      status: 'submitted',
      version: 2,
    }),
    fakeFormalizationSignatureRequestDocument({
      id: 'document-confirmed',
      requestId: 'request-1',
      status: 'confirmed',
      version: 3,
    }),
  ])
  provider.cancelEnvelope.mockResolvedValue('cancelled')
  transaction.deriveTerminalOutcome.mockResolvedValue('applied')
  const useCase = new ProcessFormalizationSignatureCancellationUseCase({
    attemptsRepository,
    resourcesRepository,
    requestsRepository,
    recipientsRepository,
    documentsRepository,
    transaction,
    provider,
  })
  return {
    useCase,
    attempt,
    attemptsRepository,
    resourcesRepository,
    requestsRepository,
    recipientsRepository,
    documentsRepository,
    transaction,
    provider,
  }
}

describe('ProcessFormalizationSignatureCancellationUseCase', () => {
  it('cancels one shared envelope and derives terminal rows without aggregate inputs', async () => {
    const fixture = makeFixture()

    await expect(
      fixture.useCase.execute({
        cancellationAttemptId: 'attempt-1',
        attemptToken: 'attempt-token',
        occurredAt: NOW,
        processedAt: NOW,
      }),
    ).resolves.toEqual({ outcome: 'cancelled' })
    expect(fixture.attemptsRepository.claim).toHaveBeenCalledWith({
      attemptId: 'attempt-1',
      attemptToken: 'attempt-token',
      now: NOW,
      leaseExpiresAt: new Date(NOW.getTime() + 30_000),
    })
    expect(fixture.provider.cancelEnvelope).toHaveBeenCalledOnce()
    expect(fixture.transaction.deriveTerminalOutcome).toHaveBeenCalledWith({
      requestId: 'request-1',
      expectedRequestVersion: 4,
      recipientChanges: [
        {
          recipientId: 'recipient-1',
          expectedVersion: 2,
          changes: { status: 'cancelled', terminalAt: NOW },
        },
      ],
      requestDocumentChanges: [
        {
          requestDocumentId: 'document-1',
          expectedVersion: 2,
          changes: { status: 'cancelled', terminalAt: NOW },
        },
      ],
      terminalAt: NOW,
    })
    const input = fixture.transaction.deriveTerminalOutcome.mock.calls[0]?.[0]
    expect(input).not.toHaveProperty('requestChanges')
    expect(input).not.toHaveProperty('formalizationChanges')
  })

  it('converges provider already-terminal and missing-resource attempts', async () => {
    const fixture = makeFixture()
    fixture.provider.cancelEnvelope.mockResolvedValue('already_terminal')
    await expect(
      fixture.useCase.execute({
        cancellationAttemptId: 'attempt-1',
        attemptToken: 'attempt-token',
        occurredAt: NOW,
        processedAt: NOW,
      }),
    ).resolves.toEqual({ outcome: 'already_terminal' })

    const withoutResource = makeFixture()
    withoutResource.resourcesRepository.findByRequestId.mockResolvedValue(null)
    await expect(
      withoutResource.useCase.execute({
        cancellationAttemptId: 'attempt-1',
        attemptToken: 'attempt-token',
        occurredAt: NOW,
        processedAt: NOW,
      }),
    ).resolves.toEqual({ outcome: 'already_terminal' })
    expect(withoutResource.provider.cancelEnvelope).not.toHaveBeenCalled()
    expect(withoutResource.transaction.deriveTerminalOutcome).toHaveBeenCalledOnce()
  })

  it('preserves an already confirmed request without provider or terminal writes', async () => {
    const fixture = makeFixture()
    fixture.requestsRepository.findById.mockResolvedValue(
      fakeFormalizationSignatureRequest({ id: 'request-1', status: 'confirmed' }),
    )

    await expect(
      fixture.useCase.execute({
        cancellationAttemptId: 'attempt-1',
        attemptToken: 'attempt-token',
        occurredAt: NOW,
        processedAt: NOW,
      }),
    ).resolves.toEqual({ outcome: 'already_terminal' })
    expect(fixture.provider.cancelEnvelope).not.toHaveBeenCalled()
    expect(fixture.transaction.deriveTerminalOutcome).not.toHaveBeenCalled()
  })

  it.each([
    'provider failure',
    'transaction conflict',
  ] as const)('keeps the attempt retryable after %s', async (failure) => {
    const fixture = makeFixture()
    if (failure === 'provider failure')
      fixture.provider.cancelEnvelope.mockRejectedValue(new Error('provider unavailable'))
    else fixture.transaction.deriveTerminalOutcome.mockResolvedValue('conflict')

    await expect(
      fixture.useCase.execute({
        cancellationAttemptId: 'attempt-1',
        attemptToken: 'attempt-token',
        occurredAt: NOW,
        processedAt: NOW,
      }),
    ).resolves.toEqual({ outcome: 'retry_required' })
    expect(fixture.attemptsRepository.replace).toHaveBeenCalledWith(
      expect.objectContaining({
        changes: expect.objectContaining({ status: 'failed' }),
      }),
    )
  })

  it('rejects a missing or foreign lease token without side effects', async () => {
    const fixture = makeFixture()

    await expect(
      fixture.useCase.execute({
        cancellationAttemptId: 'attempt-1',
        attemptToken: 'foreign-token',
        occurredAt: NOW,
        processedAt: NOW,
      }),
    ).resolves.toEqual({ outcome: 'retry_required' })
    expect(fixture.provider.cancelEnvelope).not.toHaveBeenCalled()
    expect(fixture.transaction.deriveTerminalOutcome).not.toHaveBeenCalled()
    expect(fixture.attemptsRepository.replace).not.toHaveBeenCalled()
  })

  it('does not contact the provider when another worker owns the lease', async () => {
    const fixture = makeFixture()
    fixture.attemptsRepository.claim.mockResolvedValue(null)

    await expect(
      fixture.useCase.execute({
        cancellationAttemptId: 'attempt-1',
        attemptToken: 'attempt-token',
        occurredAt: NOW,
        processedAt: NOW,
      }),
    ).resolves.toEqual({ outcome: 'retry_required' })
    expect(fixture.provider.cancelEnvelope).not.toHaveBeenCalled()
    expect(fixture.transaction.deriveTerminalOutcome).not.toHaveBeenCalled()
  })
})
