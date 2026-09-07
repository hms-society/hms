import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import { AcknowledgeSignatureDocumentUseCase } from '../acknowledge-signature-document-use-case'
import {
  fakeFormalizationSignatureGatewaySession,
  fakeFormalizationSignatureRecipient,
  fakeFormalizationSignatureRequest,
  fakeFormalizationSignatureRequestDocument,
} from '../../domain/entities/fakers'
import type {
  FormalizationSignatureDocumentAcknowledgementsRepository,
  FormalizationSignatureRecipientDocumentsRepository,
  FormalizationSignatureGatewaySessionsRepository,
  FormalizationSignatureGatewayTransaction,
  FormalizationSignatureRequestDocumentsRepository,
  FormalizationSignatureRequestsRepository,
  FormalizationSignatureRecipientsRepository,
  FormalizationSignatureSourceReader,
  SignatureSecretHasher,
} from '../../interfaces'
import type { DatetimeProvider, IdProvider } from '../../../shared/interfaces'

function makeAcknowledgementFixture(
  requestStatus:
    | 'in_progress'
    | 'partially_submitted'
    | 'sent'
    | 'provisioning' = 'in_progress',
  recipientStatus: 'reading' | 'signing' = 'reading',
) {
  const sessions = mock<FormalizationSignatureGatewaySessionsRepository>()
  const requests = mock<FormalizationSignatureRequestsRepository>()
  const documents = mock<FormalizationSignatureRequestDocumentsRepository>()
  const acknowledgements =
    mock<FormalizationSignatureDocumentAcknowledgementsRepository>()
  const assignments = mock<FormalizationSignatureRecipientDocumentsRepository>()
  const recipients = mock<FormalizationSignatureRecipientsRepository>()
  const sourceReader = mock<FormalizationSignatureSourceReader>()
  const transaction = mock<FormalizationSignatureGatewayTransaction>()
  const hasher = mock<SignatureSecretHasher>()
  hasher.hash.mockImplementation((value) => `${value}-hash`)
  sessions.findByTokenHash.mockResolvedValue(
    fakeFormalizationSignatureGatewaySession({
      id: 'session-1',
      requestId: 'request-1',
      recipientId: 'recipient-1',
      snapshotId: 'snapshot-1',
      kind: 'authenticated',
      status: 'active',
      deviceSecretHash: 'device-hash',
      csrfHash: 'csrf-hash',
      expiresAt: new Date('2026-09-04T00:00:00.000Z'),
    }),
  )
  requests.findById.mockResolvedValue(
    fakeFormalizationSignatureRequest({
      id: 'request-1',
      version: 3,
      snapshotId: 'snapshot-1',
      status: requestStatus,
    }),
  )
  documents.findById.mockResolvedValue(
    fakeFormalizationSignatureRequestDocument({
      id: 'document-1',
      requestId: 'request-1',
    }),
  )
  recipients.findById.mockResolvedValue({
    id: 'recipient-1',
    requestId: 'request-1',
    signatoryId: 'signatory-1',
    personId: 'person-1',
    actorKind: 'client',
    displayNameSnapshot: 'Client',
    deliveryChannel: 'email',
    status: recipientStatus,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  sourceReader.findAuthenticationSource.mockResolvedValue({
    personId: 'person-1',
    actorKind: 'client',
    active: true,
    channels: [],
  })
  assignments.listByRecipientId.mockResolvedValue([
    {
      id: 'assignment-1',
      requestId: 'request-1',
      recipientId: 'recipient-1',
      requestDocumentId: 'document-1',
      createdAt: new Date(),
    },
  ])
  return {
    useCase: new AcknowledgeSignatureDocumentUseCase({
      sessionsRepository: sessions,
      requestsRepository: requests,
      documentsRepository: documents,
      acknowledgementsRepository: acknowledgements,
      recipientsRepository: recipients,
      assignmentsRepository: assignments,
      sourceReader,
      transaction,
      idProvider: { generate: () => 'ack-1' } as IdProvider,
      datetimeProvider: { now: () => new Date('2026-09-03') } as DatetimeProvider,
      hasher,
    }),
    sessions,
    requests,
    documents,
    acknowledgements,
    assignments,
    recipients,
    sourceReader,
    transaction,
  }
}

describe('AcknowledgeSignatureDocumentUseCase', () => {
  it.each([
    'in_progress',
    'partially_submitted',
  ] as const)('acknowledges while the request is %s', async (requestStatus) => {
    const fixture = makeAcknowledgementFixture(requestStatus)
    fixture.transaction.acknowledgeDocument.mockResolvedValueOnce('applied')

    await expect(
      fixture.useCase.execute({
        sessionToken: 'session',
        deviceToken: 'device',
        csrfToken: 'csrf',
        requestDocumentId: 'document-1',
        expectedRequestVersion: 3,
        acknowledged: true,
        sourceIpHash: 'ip-hash',
        userAgentHash: 'ua-hash',
      }),
    ).resolves.toMatchObject({ requestDocumentId: 'document-1' })
  })

  it('ignores a coexisting HMS actor while a client acknowledges a document', async () => {
    const fixture = makeAcknowledgementFixture()
    fixture.transaction.acknowledgeDocument.mockResolvedValueOnce('applied')

    await expect(
      fixture.useCase.execute({
        sessionToken: 'session',
        deviceToken: 'device',
        csrfToken: 'csrf',
        requestDocumentId: 'document-1',
        expectedRequestVersion: 3,
        acknowledged: true,
        actorId: 'signed-in-admin',
        sourceIpHash: 'ip-hash',
        userAgentHash: 'ua-hash',
      }),
    ).resolves.toMatchObject({ requestDocumentId: 'document-1' })
  })

  it('requires the acknowledgement request literal to be true', async () => {
    const fixture = makeAcknowledgementFixture()
    await expect(
      fixture.useCase.execute({
        sessionToken: 'session',
        deviceToken: 'device',
        csrfToken: 'csrf',
        requestDocumentId: 'document-1',
        expectedRequestVersion: 3,
        acknowledged: false as true,
        sourceIpHash: 'ip-hash',
        userAgentHash: 'ua-hash',
      }),
    ).rejects.toThrow()
    expect(fixture.sessions.findByTokenHash).not.toHaveBeenCalled()
  })

  it.each([
    ['sent', 'request'],
    ['provisioning', 'request'],
    ['signing', 'recipient'],
  ] as const)('fails closed for non-signable %s %s state', async (status, owner) => {
    const fixture =
      owner === 'request'
        ? makeAcknowledgementFixture(status, 'reading')
        : makeAcknowledgementFixture('in_progress', status)
    await expect(
      fixture.useCase.execute({
        sessionToken: 'session',
        deviceToken: 'device',
        csrfToken: 'csrf',
        requestDocumentId: 'document-1',
        expectedRequestVersion: 3,
        acknowledged: true,
        sourceIpHash: 'ip-hash',
        userAgentHash: 'ua-hash',
      }),
    ).rejects.toThrow()
  })

  it.each([
    [
      'missing session',
      (fixture: ReturnType<typeof makeAcknowledgementFixture>): void => {
        fixture.sessions.findByTokenHash.mockResolvedValueOnce(null)
      },
    ],
    [
      'wrong session kind',
      (fixture: ReturnType<typeof makeAcknowledgementFixture>): void => {
        fixture.sessions.findByTokenHash.mockResolvedValueOnce(
          fakeFormalizationSignatureGatewaySession({
            requestId: 'request-1',
            recipientId: 'recipient-1',
            snapshotId: 'snapshot-1',
            kind: 'flow',
            status: 'active',
            deviceSecretHash: 'device-hash',
          }),
        )
      },
    ],
    [
      'revoked session',
      (fixture: ReturnType<typeof makeAcknowledgementFixture>): void => {
        fixture.sessions.findByTokenHash.mockResolvedValueOnce(
          fakeFormalizationSignatureGatewaySession({
            requestId: 'request-1',
            recipientId: 'recipient-1',
            snapshotId: 'snapshot-1',
            kind: 'authenticated',
            status: 'revoked',
            deviceSecretHash: 'device-hash',
          }),
        )
      },
    ],
    [
      'wrong device',
      (fixture: ReturnType<typeof makeAcknowledgementFixture>): void => {
        fixture.sessions.findByTokenHash.mockResolvedValueOnce(
          fakeFormalizationSignatureGatewaySession({
            requestId: 'request-1',
            recipientId: 'recipient-1',
            snapshotId: 'snapshot-1',
            kind: 'authenticated',
            status: 'active',
            deviceSecretHash: 'other-hash',
          }),
        )
      },
    ],
    [
      'wrong csrf',
      (fixture: ReturnType<typeof makeAcknowledgementFixture>): void => {
        fixture.sessions.findByTokenHash.mockResolvedValueOnce(
          fakeFormalizationSignatureGatewaySession({
            requestId: 'request-1',
            recipientId: 'recipient-1',
            snapshotId: 'snapshot-1',
            kind: 'authenticated',
            status: 'active',
            deviceSecretHash: 'device-hash',
            csrfHash: 'other-hash',
          }),
        )
      },
    ],
    [
      'empty audit hashes',
      (_fixture: ReturnType<typeof makeAcknowledgementFixture>): void => {},
    ],
  ] as const)('fails closed at the %s boundary without a transaction', async (label, mutate) => {
    const fixture = makeAcknowledgementFixture()
    mutate(fixture)
    await expect(
      fixture.useCase.execute({
        sessionToken: 'session',
        deviceToken: label === 'wrong device' ? 'device' : 'device',
        csrfToken: 'csrf',
        requestDocumentId: 'document-1',
        expectedRequestVersion: 3,
        acknowledged: true,
        sourceIpHash: label === 'empty audit hashes' ? '' : 'ip-hash',
        userAgentHash: label === 'empty audit hashes' ? '' : 'ua-hash',
      }),
    ).rejects.toThrow()
  })

  it.each([
    [
      'missing request',
      (_fixture: ReturnType<typeof makeAcknowledgementFixture>): void => {},
    ],
    [
      'stale request version',
      (fixture: ReturnType<typeof makeAcknowledgementFixture>): void => {
        fixture.requests.findById.mockResolvedValueOnce(
          fakeFormalizationSignatureRequest({
            id: 'request-1',
            version: 4,
            snapshotId: 'snapshot-1',
            status: 'in_progress',
          }),
        )
      },
    ],
    [
      'stale snapshot',
      (fixture: ReturnType<typeof makeAcknowledgementFixture>): void => {
        fixture.sessions.findByTokenHash.mockResolvedValueOnce(
          fakeFormalizationSignatureGatewaySession({
            requestId: 'request-1',
            recipientId: 'recipient-1',
            snapshotId: 'old-snapshot',
            kind: 'authenticated',
            status: 'active',
            deviceSecretHash: 'device-hash',
          }),
        )
      },
    ],
  ] as const)('fails closed for %s request state', async (label, mutate) => {
    const fixture = makeAcknowledgementFixture()
    if (label === 'missing request') fixture.requests.findById.mockResolvedValueOnce(null)
    else mutate(fixture)
    await expect(
      fixture.useCase.execute({
        sessionToken: 'session',
        deviceToken: 'device',
        csrfToken: 'csrf',
        requestDocumentId: 'document-1',
        expectedRequestVersion: 3,
        acknowledged: true,
        sourceIpHash: 'ip-hash',
        userAgentHash: 'ua-hash',
      }),
    ).rejects.toThrow()
  })

  it.each([
    [
      'missing recipient',
      (fixture: ReturnType<typeof makeAcknowledgementFixture>): void => {
        fixture.recipients.findById.mockResolvedValueOnce(null)
      },
    ],
    [
      'foreign recipient',
      (fixture: ReturnType<typeof makeAcknowledgementFixture>): void => {
        fixture.recipients.findById.mockResolvedValueOnce({
          ...fakeFormalizationSignatureRecipient({
            id: 'recipient-1',
            requestId: 'request-2',
            status: 'reading',
          }),
          personId: 'person-1',
        })
      },
    ],
    [
      'inactive identity',
      (fixture: ReturnType<typeof makeAcknowledgementFixture>): void => {
        fixture.sourceReader.findAuthenticationSource.mockResolvedValueOnce(null)
      },
    ],
    [
      'kind-mismatched identity',
      (fixture: ReturnType<typeof makeAcknowledgementFixture>): void => {
        fixture.sourceReader.findAuthenticationSource.mockResolvedValueOnce({
          personId: 'person-1',
          actorKind: 'collaborator',
          active: true,
          channels: [],
        })
      },
    ],
  ] as const)('fails closed for %s recipient eligibility', async (label, mutate) => {
    const fixture = makeAcknowledgementFixture()
    mutate(fixture)
    await expect(
      fixture.useCase.execute({
        sessionToken: 'session',
        deviceToken: 'device',
        csrfToken: 'csrf',
        requestDocumentId: 'document-1',
        expectedRequestVersion: 3,
        acknowledged: true,
        sourceIpHash: 'ip-hash',
        userAgentHash: 'ua-hash',
      }),
    ).rejects.toThrow()
  })

  it('requires the collaborator actor to match the recipient identity', async () => {
    const fixture = makeAcknowledgementFixture()
    fixture.recipients.findById.mockResolvedValueOnce({
      ...fakeFormalizationSignatureRecipient({
        id: 'recipient-1',
        requestId: 'request-1',
        personId: 'collaborator-1',
        actorKind: 'collaborator',
        status: 'reading',
      }),
    })
    fixture.sourceReader.findAuthenticationSource.mockResolvedValueOnce({
      personId: 'collaborator-1',
      actorKind: 'collaborator',
      active: true,
      channels: [],
    })
    await expect(
      fixture.useCase.execute({
        sessionToken: 'session',
        deviceToken: 'device',
        csrfToken: 'csrf',
        requestDocumentId: 'document-1',
        expectedRequestVersion: 3,
        acknowledged: true,
        sourceIpHash: 'ip-hash',
        userAgentHash: 'ua-hash',
      }),
    ).rejects.toThrow()
    expect(fixture.sessions.findByTokenHash).toHaveBeenCalled()
  })

  it.each([
    ['missing', []],
    [
      'foreign',
      [
        {
          id: 'a',
          requestId: 'request-2',
          recipientId: 'recipient-1',
          requestDocumentId: 'document-1',
          createdAt: new Date(),
        },
      ],
    ],
    [
      'duplicate',
      [
        {
          id: 'a',
          requestId: 'request-1',
          recipientId: 'recipient-1',
          requestDocumentId: 'document-1',
          createdAt: new Date(),
        },
        {
          id: 'b',
          requestId: 'request-1',
          recipientId: 'recipient-1',
          requestDocumentId: 'document-1',
          createdAt: new Date(),
        },
      ],
    ],
  ] as const)('rejects %s assignment state without side effects', async (_label, assignmentRows) => {
    const fixture = makeAcknowledgementFixture()
    fixture.assignments.listByRecipientId.mockResolvedValueOnce(assignmentRows as never)
    await expect(
      fixture.useCase.execute({
        sessionToken: 'session',
        deviceToken: 'device',
        csrfToken: 'csrf',
        requestDocumentId: 'document-1',
        expectedRequestVersion: 3,
        acknowledged: true,
        sourceIpHash: 'ip-hash',
        userAgentHash: 'ua-hash',
      }),
    ).rejects.toThrow()
    expect(fixture.transaction.acknowledgeDocument).not.toHaveBeenCalled()
  })

  it.each([
    [
      'malformed',
      {
        id: 'ack-1',
        requestId: 'request-2',
        requestDocumentId: 'document-1',
        recipientId: 'recipient-1',
        snapshotId: 'snapshot-1',
        sessionId: 'session-1',
        acknowledgedAt: new Date(),
        createdAt: new Date(),
      },
    ],
    [
      'duplicate',
      {
        id: 'ack-1',
        requestId: 'request-1',
        requestDocumentId: 'document-1',
        recipientId: 'recipient-1',
        snapshotId: 'snapshot-1',
        sessionId: 'session-1',
        acknowledgedAt: new Date(),
        createdAt: new Date(),
      },
    ],
  ] as const)('handles %s acknowledgement idempotently or safely', async (label, existing) => {
    const fixture = makeAcknowledgementFixture()
    fixture.acknowledgements.findByRecipientDocumentAndSnapshot.mockResolvedValueOnce(
      existing,
    )
    if (label === 'malformed') {
      await expect(
        fixture.useCase.execute({
          sessionToken: 'session',
          deviceToken: 'device',
          csrfToken: 'csrf',
          requestDocumentId: 'document-1',
          expectedRequestVersion: 3,
          acknowledged: true,
          sourceIpHash: 'ip-hash',
          userAgentHash: 'ua-hash',
        }),
      ).rejects.toThrow()
      expect(fixture.transaction.acknowledgeDocument).not.toHaveBeenCalled()
    } else {
      await expect(
        fixture.useCase.execute({
          sessionToken: 'session',
          deviceToken: 'device',
          csrfToken: 'csrf',
          requestDocumentId: 'document-1',
          expectedRequestVersion: 3,
          acknowledged: true,
          sourceIpHash: 'ip-hash',
          userAgentHash: 'ua-hash',
        }),
      ).resolves.toMatchObject({ requestDocumentId: 'document-1' })
      expect(fixture.transaction.acknowledgeDocument).not.toHaveBeenCalled()
    }
  })

  it.each([
    'conflict',
    'duplicate',
  ] as const)('handles a transaction %s outcome', async (outcome) => {
    const fixture = makeAcknowledgementFixture()
    fixture.transaction.acknowledgeDocument.mockResolvedValueOnce(outcome)
    const execution = fixture.useCase.execute({
      sessionToken: 'session',
      deviceToken: 'device',
      csrfToken: 'csrf',
      requestDocumentId: 'document-1',
      expectedRequestVersion: 3,
      acknowledged: true,
      sourceIpHash: 'ip-hash',
      userAgentHash: 'ua-hash',
    })
    if (outcome === 'conflict') await expect(execution).rejects.toThrow()
    else
      await expect(execution).resolves.toMatchObject({ requestDocumentId: 'document-1' })
  })

  it.each([
    'confirmed',
    'rejected',
    'cancelled',
    'expired',
  ] as const)('rejects terminal request state %s before repository side effects', async (status) => {
    const fixture = makeAcknowledgementFixture()
    fixture.requests.findById.mockResolvedValueOnce(
      fakeFormalizationSignatureRequest({
        id: 'request-1',
        snapshotId: 'snapshot-1',
        version: 3,
        status,
      }),
    )
    await expect(
      fixture.useCase.execute({
        sessionToken: 'session',
        deviceToken: 'device',
        csrfToken: 'csrf',
        requestDocumentId: 'document-1',
        expectedRequestVersion: 3,
        acknowledged: true,
        sourceIpHash: 'ip-hash',
        userAgentHash: 'ua-hash',
      }),
    ).rejects.toThrow()
    expect(fixture.transaction.acknowledgeDocument).not.toHaveBeenCalled()
  })

  it.each([
    'confirmed',
    'rejected',
    'cancelled',
    'expired',
  ] as const)('rejects terminal recipient state %s before repository side effects', async (status) => {
    const fixture = makeAcknowledgementFixture()
    fixture.recipients.findById.mockResolvedValueOnce({
      ...fakeFormalizationSignatureRecipient({
        id: 'recipient-1',
        requestId: 'request-1',
        personId: 'person-1',
        status,
      }),
    })
    await expect(
      fixture.useCase.execute({
        sessionToken: 'session',
        deviceToken: 'device',
        csrfToken: 'csrf',
        requestDocumentId: 'document-1',
        expectedRequestVersion: 3,
        acknowledged: true,
        sourceIpHash: 'ip-hash',
        userAgentHash: 'ua-hash',
      }),
    ).rejects.toThrow()
    expect(fixture.transaction.acknowledgeDocument).not.toHaveBeenCalled()
  })

  it('records a request/recipient/document acknowledgement transactionally', async () => {
    const sessions = mock<FormalizationSignatureGatewaySessionsRepository>()
    const requests = mock<FormalizationSignatureRequestsRepository>()
    const documents = mock<FormalizationSignatureRequestDocumentsRepository>()
    const acknowledgements =
      mock<FormalizationSignatureDocumentAcknowledgementsRepository>()
    const assignments = mock<FormalizationSignatureRecipientDocumentsRepository>()
    const recipients = mock<FormalizationSignatureRecipientsRepository>()
    const sourceReader = mock<FormalizationSignatureSourceReader>()
    const transaction = mock<FormalizationSignatureGatewayTransaction>()
    const hasher = mock<SignatureSecretHasher>()
    hasher.hash.mockImplementation((value) => `${value}-hash`)
    sessions.findByTokenHash.mockResolvedValue(
      fakeFormalizationSignatureGatewaySession({
        id: 'session-1',
        requestId: 'request-1',
        recipientId: 'recipient-1',
        snapshotId: 'snapshot-1',
        kind: 'authenticated',
        status: 'active',
        deviceSecretHash: 'device-hash',
        csrfHash: 'csrf-hash',
        expiresAt: new Date('2026-09-04T00:00:00.000Z'),
      }),
    )
    requests.findById.mockResolvedValue(
      fakeFormalizationSignatureRequest({
        id: 'request-1',
        version: 3,
        snapshotId: 'snapshot-1',
        status: 'in_progress',
      }),
    )
    documents.findById.mockResolvedValue(
      fakeFormalizationSignatureRequestDocument({
        id: 'document-1',
        requestId: 'request-1',
      }),
    )
    recipients.findById.mockResolvedValue({
      id: 'recipient-1',
      requestId: 'request-1',
      signatoryId: 'signatory-1',
      personId: 'person-1',
      actorKind: 'client',
      displayNameSnapshot: 'Client',
      deliveryChannel: 'email',
      status: 'reading',
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    sourceReader.findAuthenticationSource.mockResolvedValue({
      personId: 'person-1',
      actorKind: 'client',
      active: true,
      channels: [],
    })
    assignments.listByRecipientId.mockResolvedValue([
      {
        id: 'assignment-1',
        requestId: 'request-1',
        recipientId: 'recipient-1',
        requestDocumentId: 'document-1',
        createdAt: new Date(),
      },
    ])
    transaction.acknowledgeDocument.mockResolvedValue('applied')
    const result = await new AcknowledgeSignatureDocumentUseCase({
      sessionsRepository: sessions,
      requestsRepository: requests,
      documentsRepository: documents,
      acknowledgementsRepository: acknowledgements,
      recipientsRepository: recipients,
      assignmentsRepository: assignments,
      sourceReader,
      transaction,
      idProvider: { generate: () => 'ack-1' } as IdProvider,
      datetimeProvider: {
        now: () => new Date('2026-09-03T00:00:00.000Z'),
      } as DatetimeProvider,
      hasher,
    }).execute({
      sessionToken: 'session',
      deviceToken: 'device',
      csrfToken: 'csrf',
      requestDocumentId: 'document-1',
      expectedRequestVersion: 3,
      acknowledged: true,
      sourceIpHash: 'ip-hash',
      userAgentHash: 'ua-hash',
    })
    expect(result.requestDocumentId).toBe('document-1')
    expect(transaction.acknowledgeDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'request-1',
        requestDocumentId: 'document-1',
        acknowledgement: expect.objectContaining({
          recipientId: 'recipient-1',
          snapshotId: 'snapshot-1',
          sourceIpHash: 'ip-hash',
          userAgentHash: 'ua-hash',
        }),
      }),
    )
  })

  it('treats a duplicate acknowledgement as a no-op', async () => {
    const sessions = mock<FormalizationSignatureGatewaySessionsRepository>()
    const requests = mock<FormalizationSignatureRequestsRepository>()
    const documents = mock<FormalizationSignatureRequestDocumentsRepository>()
    const acknowledgements =
      mock<FormalizationSignatureDocumentAcknowledgementsRepository>()
    const assignments = mock<FormalizationSignatureRecipientDocumentsRepository>()
    const recipients = mock<FormalizationSignatureRecipientsRepository>()
    const sourceReader = mock<FormalizationSignatureSourceReader>()
    const transaction = mock<FormalizationSignatureGatewayTransaction>()
    const hasher = mock<SignatureSecretHasher>()
    hasher.hash.mockImplementation((value) => `${value}-hash`)
    sessions.findByTokenHash.mockResolvedValue(
      fakeFormalizationSignatureGatewaySession({
        id: 'session-1',
        requestId: 'request-1',
        recipientId: 'recipient-1',
        snapshotId: 'snapshot-1',
        kind: 'authenticated',
        status: 'active',
        deviceSecretHash: 'device-hash',
        csrfHash: 'csrf-hash',
        expiresAt: new Date('2026-09-04T00:00:00.000Z'),
      }),
    )
    requests.findById.mockResolvedValue(
      fakeFormalizationSignatureRequest({
        id: 'request-1',
        version: 3,
        snapshotId: 'snapshot-1',
        status: 'in_progress',
      }),
    )
    documents.findById.mockResolvedValue(
      fakeFormalizationSignatureRequestDocument({
        id: 'document-1',
        requestId: 'request-1',
      }),
    )
    recipients.findById.mockResolvedValue({
      id: 'recipient-1',
      requestId: 'request-1',
      signatoryId: 'signatory-1',
      personId: 'person-1',
      actorKind: 'client',
      displayNameSnapshot: 'Client',
      deliveryChannel: 'email',
      status: 'reading',
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    sourceReader.findAuthenticationSource.mockResolvedValue({
      personId: 'person-1',
      actorKind: 'client',
      active: true,
      channels: [],
    })
    assignments.listByRecipientId.mockResolvedValue([
      {
        id: 'assignment-1',
        requestId: 'request-1',
        recipientId: 'recipient-1',
        requestDocumentId: 'document-1',
        createdAt: new Date(),
      },
    ])
    acknowledgements.findByRecipientDocumentAndSnapshot.mockResolvedValue({
      id: 'ack-1',
      requestId: 'request-1',
      requestDocumentId: 'document-1',
      recipientId: 'recipient-1',
      snapshotId: 'snapshot-1',
      sessionId: 'session-0',
      acknowledgedAt: new Date('2026-09-02T00:00:00.000Z'),
      createdAt: new Date(),
    })
    const result = await new AcknowledgeSignatureDocumentUseCase({
      sessionsRepository: sessions,
      requestsRepository: requests,
      documentsRepository: documents,
      acknowledgementsRepository: acknowledgements,
      recipientsRepository: recipients,
      assignmentsRepository: assignments,
      sourceReader,
      transaction,
      idProvider: { generate: () => 'unused' } as IdProvider,
      datetimeProvider: {
        now: () => new Date('2026-09-03T00:00:00.000Z'),
      } as DatetimeProvider,
      hasher,
    }).execute({
      sessionToken: 'session',
      deviceToken: 'device',
      csrfToken: 'csrf',
      requestDocumentId: 'document-1',
      expectedRequestVersion: 3,
      acknowledged: true,
      sourceIpHash: 'ip-hash',
      userAgentHash: 'ua-hash',
    })
    expect(result.acknowledgedAt).toEqual(new Date('2026-09-02T00:00:00.000Z'))
    expect(transaction.acknowledgeDocument).not.toHaveBeenCalled()
  })

  it('rejects a document foreign to the authenticated request', async () => {
    const sessions = mock<FormalizationSignatureGatewaySessionsRepository>()
    const requests = mock<FormalizationSignatureRequestsRepository>()
    const documents = mock<FormalizationSignatureRequestDocumentsRepository>()
    const acknowledgements =
      mock<FormalizationSignatureDocumentAcknowledgementsRepository>()
    const assignments = mock<FormalizationSignatureRecipientDocumentsRepository>()
    const recipients = mock<FormalizationSignatureRecipientsRepository>()
    const sourceReader = mock<FormalizationSignatureSourceReader>()
    const transaction = mock<FormalizationSignatureGatewayTransaction>()
    const hasher = mock<SignatureSecretHasher>()
    hasher.hash.mockImplementation((value) => `${value}-hash`)
    sessions.findByTokenHash.mockResolvedValue(
      fakeFormalizationSignatureGatewaySession({
        requestId: 'request-1',
        recipientId: 'recipient-1',
        snapshotId: 'snapshot-1',
        kind: 'authenticated',
        status: 'active',
        deviceSecretHash: 'device-hash',
        csrfHash: 'csrf-hash',
        expiresAt: new Date('2026-09-04T00:00:00.000Z'),
      }),
    )
    requests.findById.mockResolvedValue(
      fakeFormalizationSignatureRequest({
        id: 'request-1',
        version: 3,
        snapshotId: 'snapshot-1',
        status: 'in_progress',
      }),
    )
    documents.findById.mockResolvedValue(
      fakeFormalizationSignatureRequestDocument({
        id: 'foreign-document',
        requestId: 'request-2',
      }),
    )
    const useCase = new AcknowledgeSignatureDocumentUseCase({
      sessionsRepository: sessions,
      requestsRepository: requests,
      documentsRepository: documents,
      acknowledgementsRepository: acknowledgements,
      recipientsRepository: recipients,
      assignmentsRepository: assignments,
      sourceReader,
      transaction,
      idProvider: { generate: () => 'unused' } as IdProvider,
      datetimeProvider: { now: () => new Date() } as DatetimeProvider,
      hasher,
    })
    await expect(
      useCase.execute({
        sessionToken: 'session',
        deviceToken: 'device',
        csrfToken: 'csrf',
        requestDocumentId: 'foreign-document',
        expectedRequestVersion: 3,
        acknowledged: true,
        sourceIpHash: 'ip-hash',
        userAgentHash: 'ua-hash',
      }),
    ).rejects.toThrow()
    expect(transaction.acknowledgeDocument).not.toHaveBeenCalled()
  })
})
