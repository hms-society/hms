import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import type { Broker, DatetimeProvider } from '../../../shared/interfaces'
import {
  fakeFormalizationSignatureGatewaySession,
  fakeFormalizationSignatureProxyBinding,
  fakeFormalizationSignatureRecipient,
  fakeFormalizationSignatureRequest,
  fakeFormalizationSignatureRequestDocument,
} from '../../domain/entities/fakers'
import type {
  FormalizationSignatureGatewaySessionsRepository,
  FormalizationSignatureGatewayTransaction,
  FormalizationSignatureProxyBindingsRepository,
  FormalizationSignatureRecipientDocumentsRepository,
  FormalizationSignatureRecipientsRepository,
  FormalizationSignatureRequestDocumentsRepository,
  FormalizationSignatureRequestsRepository,
} from '../../interfaces'
import { RecordProviderSubmissionUseCase } from '../record-provider-submission-use-case'

const NOW = new Date('2026-09-03T12:00:00.000Z')
const OBSERVATION_ID = '5f5c745a05158ee4fb88fc7260faaf18c7d2345d82bbe0c5947463f6691f608c'

function makeFixture() {
  const sessionsRepository = mock<FormalizationSignatureGatewaySessionsRepository>()
  const bindingsRepository = mock<FormalizationSignatureProxyBindingsRepository>()
  const requestsRepository = mock<FormalizationSignatureRequestsRepository>()
  const recipientsRepository = mock<FormalizationSignatureRecipientsRepository>()
  const documentsRepository = mock<FormalizationSignatureRequestDocumentsRepository>()
  const assignmentsRepository =
    mock<FormalizationSignatureRecipientDocumentsRepository>()
  const transaction = mock<FormalizationSignatureGatewayTransaction>()
  const datetimeProvider = mock<DatetimeProvider>()
  const broker = mock<Broker>()
  const session = fakeFormalizationSignatureGatewaySession({
    id: 'session-1',
    requestId: 'request-1',
    recipientId: 'recipient-1',
    snapshotId: 'snapshot-1',
    kind: 'authenticated',
    status: 'active',
    version: 4,
    expiresAt: new Date(NOW.getTime() + 60_000),
  })
  const binding = fakeFormalizationSignatureProxyBinding({
    id: 'binding-1',
    requestId: 'request-1',
    recipientId: 'recipient-1',
    sessionId: 'session-1',
    aliasHash: 'alias-hash',
    status: 'active',
    expiresAt: new Date(NOW.getTime() + 60_000),
  })
  sessionsRepository.findActiveByRecipientId.mockResolvedValue([session])
  bindingsRepository.findByAliasHash.mockResolvedValue(binding)
  requestsRepository.findById.mockResolvedValue(
    fakeFormalizationSignatureRequest({
      id: 'request-1',
      snapshotId: 'snapshot-1',
      status: 'in_progress',
    }),
  )
  recipientsRepository.findById.mockResolvedValue(
    fakeFormalizationSignatureRecipient({
      id: 'recipient-1',
      requestId: 'request-1',
      status: 'signing',
      version: 3,
    }),
  )
  documentsRepository.listByRequestId.mockResolvedValue([
    fakeFormalizationSignatureRequestDocument({
      id: 'document-1',
      requestId: 'request-1',
      position: 1,
    }),
    fakeFormalizationSignatureRequestDocument({
      id: 'document-2',
      requestId: 'request-1',
      position: 2,
    }),
  ])
  assignmentsRepository.listByRecipientId.mockResolvedValue([
    {
      id: 'assignment-1',
      requestId: 'request-1',
      recipientId: 'recipient-1',
      requestDocumentId: 'document-1',
      createdAt: NOW,
    },
    {
      id: 'assignment-2',
      requestId: 'request-1',
      recipientId: 'recipient-1',
      requestDocumentId: 'document-2',
      createdAt: NOW,
    },
  ])
  datetimeProvider.now.mockReturnValue(NOW)
  transaction.recordSubmission.mockResolvedValue('applied')
  broker.publish.mockResolvedValue()
  const useCase = new RecordProviderSubmissionUseCase({
    sessionsRepository,
    bindingsRepository,
    requestsRepository,
    recipientsRepository,
    documentsRepository,
    assignmentsRepository,
    transaction,
    datetimeProvider,
    broker,
  })
  const request = {
    requestId: 'request-1',
    recipientId: 'recipient-1',
    sessionId: 'session-1',
    bindingId: 'binding-1',
    expectedBindingAliasHash: 'alias-hash',
    providerObservationId: OBSERVATION_ID,
    expectedRecipientVersion: 3,
    expectedSessionVersion: 4,
    submittedAt: NOW,
  }
  return {
    useCase,
    request,
    session,
    binding,
    sessionsRepository,
    bindingsRepository,
    requestsRepository,
    recipientsRepository,
    documentsRepository,
    assignmentsRepository,
    transaction,
    broker,
  }
}

describe('Record Provider Submission Use Case', () => {
  it('publishes only this recipient assigned documents for a partially assigned package', async () => {
    const fixture = makeFixture()
    fixture.documentsRepository.listByRequestId.mockResolvedValue([
      fakeFormalizationSignatureRequestDocument({
        id: 'document-1',
        requestId: 'request-1',
        position: 1,
      }),
      fakeFormalizationSignatureRequestDocument({
        id: 'document-2',
        requestId: 'request-1',
        position: 2,
      }),
      fakeFormalizationSignatureRequestDocument({
        id: 'document-3',
        requestId: 'request-1',
        position: 3,
      }),
    ])
    fixture.assignmentsRepository.listByRecipientId.mockResolvedValue([
      {
        id: 'assignment-3',
        requestId: 'request-1',
        recipientId: 'recipient-1',
        requestDocumentId: 'document-3',
        createdAt: NOW,
      },
      {
        id: 'assignment-1',
        requestId: 'request-1',
        recipientId: 'recipient-1',
        requestDocumentId: 'document-1',
        createdAt: NOW,
      },
    ])

    await fixture.useCase.execute(fixture.request)

    expect(fixture.assignmentsRepository.listByRecipientId).toHaveBeenCalledWith(
      'recipient-1',
    )
    expect(fixture.transaction.recordSubmission).toHaveBeenCalledWith({
      requestId: 'request-1',
      recipientId: 'recipient-1',
      expectedRecipientVersion: 3,
      sessionId: 'session-1',
      expectedSessionVersion: 4,
      bindingId: 'binding-1',
      expectedBindingAliasHash: 'alias-hash',
      providerObservationId: OBSERVATION_ID,
      submittedAt: NOW,
    })
    const input = fixture.transaction.recordSubmission.mock.calls[0]?.[0]
    expect(input).not.toHaveProperty('recipientChanges')
    expect(input).not.toHaveProperty('sessionChanges')
    expect(input).not.toHaveProperty('resultSession')
    expect(input).not.toHaveProperty('formalizationChanges')
    expect(fixture.broker.publish).toHaveBeenCalledOnce()
    expect(fixture.transaction.recordSubmission.mock.invocationCallOrder[0]).toBeLessThan(
      fixture.broker.publish.mock.invocationCallOrder[0] ?? 0,
    )
    expect(fixture.broker.publish.mock.calls[0]?.[0]).toMatchObject({
      payload: {
        requestId: 'request-1',
        recipientId: 'recipient-1',
        requestDocumentIds: ['document-1', 'document-3'],
        providerObservationId: OBSERVATION_ID,
      },
    })
  })

  it('requests deterministic ambiguous-submission reconciliation for a durable duplicate', async () => {
    const fixture = makeFixture()
    fixture.transaction.recordSubmission.mockResolvedValue('duplicate')
    fixture.sessionsRepository.findActiveByRecipientId.mockResolvedValue([
      { ...fixture.session, kind: 'result', version: 5 },
    ])
    fixture.bindingsRepository.findByAliasHash.mockResolvedValue({
      ...fixture.binding,
      status: 'revoked',
      revokedAt: NOW,
      revocationReason: 'submitted',
    })
    fixture.recipientsRepository.findById.mockResolvedValue(
      fakeFormalizationSignatureRecipient({
        id: 'recipient-1',
        requestId: 'request-1',
        status: 'submitted',
        version: 4,
        submissionObservationId: OBSERVATION_ID,
      }),
    )

    await expect(fixture.useCase.execute(fixture.request)).resolves.toBeUndefined()
    expect(fixture.broker.publish).toHaveBeenCalledOnce()
    expect(fixture.broker.publish.mock.calls[0]?.[0]).toMatchObject({
      name: 'formalization.signature-reconciliation-requested.v1',
      payload: {
        requestId: 'request-1',
        reason: 'ambiguous_submission',
        earliestRunAt: NOW,
      },
    })
  })

  it('restores a safe signal when publication fails after commit and retry is duplicate', async () => {
    const fixture = makeFixture()
    fixture.transaction.recordSubmission
      .mockResolvedValueOnce('applied')
      .mockResolvedValue('duplicate')
    fixture.broker.publish.mockRejectedValueOnce(new Error('broker unavailable'))

    await expect(fixture.useCase.execute(fixture.request)).rejects.toThrow(
      'broker unavailable',
    )
    expect(fixture.transaction.recordSubmission).toHaveBeenCalledOnce()
    expect(fixture.broker.publish.mock.calls[0]?.[0]).toMatchObject({
      name: 'formalization.signature-recipient-submitted.v1',
      payload: { requestDocumentIds: ['document-1', 'document-2'] },
    })

    fixture.sessionsRepository.findActiveByRecipientId.mockResolvedValue([
      { ...fixture.session, kind: 'result', version: 5 },
    ])
    fixture.bindingsRepository.findByAliasHash.mockResolvedValue({
      ...fixture.binding,
      status: 'revoked',
      revokedAt: NOW,
      revocationReason: 'submitted',
    })
    fixture.recipientsRepository.findById.mockResolvedValue(
      fakeFormalizationSignatureRecipient({
        id: 'recipient-1',
        requestId: 'request-1',
        status: 'submitted',
        version: 4,
        submissionObservationId: OBSERVATION_ID,
      }),
    )

    await expect(fixture.useCase.execute(fixture.request)).resolves.toBeUndefined()
    await expect(fixture.useCase.execute(fixture.request)).resolves.toBeUndefined()

    expect(fixture.transaction.recordSubmission).toHaveBeenCalledTimes(3)
    expect(fixture.broker.publish).toHaveBeenCalledTimes(3)
    expect(fixture.broker.publish.mock.calls.slice(1).map(([event]) => event)).toEqual([
      expect.objectContaining({
        name: 'formalization.signature-reconciliation-requested.v1',
        payload: expect.objectContaining({
          requestId: 'request-1',
          reason: 'ambiguous_submission',
          earliestRunAt: NOW,
        }),
      }),
      expect.objectContaining({
        name: 'formalization.signature-reconciliation-requested.v1',
        payload: expect.objectContaining({
          requestId: 'request-1',
          reason: 'ambiguous_submission',
          earliestRunAt: NOW,
        }),
      }),
    ])
  })

  it.each([
    ['missing', []],
    [
      'malformed empty identity',
      [
        {
          id: '',
          requestId: 'request-1',
          recipientId: 'recipient-1',
          requestDocumentId: 'document-1',
          createdAt: NOW,
        },
      ],
    ],
    [
      'foreign request',
      [
        {
          id: 'assignment-1',
          requestId: 'foreign-request',
          recipientId: 'recipient-1',
          requestDocumentId: 'document-1',
          createdAt: NOW,
        },
      ],
    ],
    [
      'foreign recipient',
      [
        {
          id: 'assignment-1',
          requestId: 'request-1',
          recipientId: 'recipient-2',
          requestDocumentId: 'document-1',
          createdAt: NOW,
        },
      ],
    ],
    [
      'foreign document',
      [
        {
          id: 'assignment-1',
          requestId: 'request-1',
          recipientId: 'recipient-1',
          requestDocumentId: 'foreign-document',
          createdAt: NOW,
        },
      ],
    ],
    [
      'duplicate relation',
      [
        {
          id: 'assignment-1',
          requestId: 'request-1',
          recipientId: 'recipient-1',
          requestDocumentId: 'document-1',
          createdAt: NOW,
        },
        {
          id: 'assignment-2',
          requestId: 'request-1',
          recipientId: 'recipient-1',
          requestDocumentId: 'document-1',
          createdAt: NOW,
        },
      ],
    ],
    [
      'duplicate entity id',
      [
        {
          id: 'assignment-1',
          requestId: 'request-1',
          recipientId: 'recipient-1',
          requestDocumentId: 'document-1',
          createdAt: NOW,
        },
        {
          id: 'assignment-1',
          requestId: 'request-1',
          recipientId: 'recipient-1',
          requestDocumentId: 'document-2',
          createdAt: NOW,
        },
      ],
    ],
  ])('rejects %s recipient assignment graph before commit', async (_label, rows) => {
    const fixture = makeFixture()
    fixture.assignmentsRepository.listByRecipientId.mockResolvedValue(rows)

    await expect(fixture.useCase.execute(fixture.request)).rejects.toThrow()
    expect(fixture.transaction.recordSubmission).not.toHaveBeenCalled()
    expect(fixture.broker.publish).not.toHaveBeenCalled()
  })

  it('rejects a different or non-normalized observation before graph access', async () => {
    const fixture = makeFixture()

    await expect(
      fixture.useCase.execute({
        ...fixture.request,
        providerObservationId: 'provider-raw',
      }),
    ).rejects.toThrow()
    expect(fixture.requestsRepository.findById).not.toHaveBeenCalled()
    expect(fixture.transaction.recordSubmission).not.toHaveBeenCalled()
  })

  it.each([
    ['missing session', () => []],
    [
      'foreign session',
      (fixture: ReturnType<typeof makeFixture>) => [
        { ...fixture.session, requestId: 'foreign' },
      ],
    ],
    [
      'wrong session version',
      (fixture: ReturnType<typeof makeFixture>) => [{ ...fixture.session, version: 5 }],
    ],
    [
      'expired session',
      (fixture: ReturnType<typeof makeFixture>) => [
        { ...fixture.session, expiresAt: NOW },
      ],
    ],
    [
      'wrong session kind',
      (fixture: ReturnType<typeof makeFixture>) => [
        { ...fixture.session, kind: 'flow' as const },
      ],
    ],
  ])('fails closed for %s', async (_label, sessions) => {
    const fixture = makeFixture()
    fixture.sessionsRepository.findActiveByRecipientId.mockResolvedValue(
      sessions(fixture) as never,
    )

    await expect(fixture.useCase.execute(fixture.request)).rejects.toThrow()
    expect(fixture.transaction.recordSubmission).not.toHaveBeenCalled()
    expect(fixture.broker.publish).not.toHaveBeenCalled()
  })

  it.each([
    ['missing binding', null],
    ['foreign binding', { requestId: 'foreign' }],
    ['wrong binding id', { id: 'other-binding' }],
    ['wrong alias proof', { aliasHash: 'other-hash' }],
    ['expired binding', { expiresAt: NOW }],
  ])('rejects %s without committing', async (_label, override) => {
    const fixture = makeFixture()
    fixture.bindingsRepository.findByAliasHash.mockResolvedValue(
      override === null ? null : ({ ...fixture.binding, ...override } as never),
    )

    await expect(fixture.useCase.execute(fixture.request)).rejects.toThrow()
    expect(fixture.transaction.recordSubmission).not.toHaveBeenCalled()
    expect(fixture.broker.publish).not.toHaveBeenCalled()
  })

  it.each([
    ['missing request', 'request'],
    ['missing recipient', 'recipient'],
    ['foreign document', 'document'],
  ])('rejects %s membership before committing', async (_label, kind) => {
    const fixture = makeFixture()
    if (kind === 'request') fixture.requestsRepository.findById.mockResolvedValue(null)
    if (kind === 'recipient')
      fixture.recipientsRepository.findById.mockResolvedValue(null)
    if (kind === 'document')
      fixture.documentsRepository.listByRequestId.mockResolvedValue([
        fakeFormalizationSignatureRequestDocument({ requestId: 'foreign' }),
      ])

    await expect(fixture.useCase.execute(fixture.request)).rejects.toThrow()
    expect(fixture.transaction.recordSubmission).not.toHaveBeenCalled()
  })

  it('throws on a transaction conflict and publishes nothing', async () => {
    const fixture = makeFixture()
    fixture.transaction.recordSubmission.mockResolvedValue('conflict')

    await expect(fixture.useCase.execute(fixture.request)).rejects.toThrow()
    expect(fixture.broker.publish).not.toHaveBeenCalled()
  })
})
