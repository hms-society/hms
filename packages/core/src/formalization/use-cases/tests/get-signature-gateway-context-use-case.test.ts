import { describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import type { DatetimeProvider } from '../../../shared/interfaces'
import {
  fakeFormalizationSignatureGatewaySession,
  fakeFormalizationSignatureProtocol,
  fakeFormalizationSignatureRecipient,
  fakeFormalizationSignatureRequest,
  fakeFormalizationSignatureRequestDocument,
} from '../../domain/entities/fakers'
import type {
  FormalizationSignatureDocumentAcknowledgementsRepository,
  FormalizationSignatureGatewaySessionsRepository,
  FormalizationSignatureProxyBindingsRepository,
  FormalizationSignatureProtocolsRepository,
  FormalizationSignatureRecipientDocumentsRepository,
  FormalizationSignatureRecipientsRepository,
  FormalizationSignatureRequestDocumentsRepository,
  FormalizationSignatureRequestsRepository,
  FormalizationSignatureSourceReader,
  SignatureSecretHasher,
} from '../../interfaces'
import { GetSignatureGatewayContextUseCase } from '../get-signature-gateway-context-use-case'

const NOW = new Date('2026-09-02T20:00:00.000Z')

type Dependencies = {
  sessionsRepository: MockProxy<FormalizationSignatureGatewaySessionsRepository>
  recipientsRepository: MockProxy<FormalizationSignatureRecipientsRepository>
  documentsRepository: MockProxy<FormalizationSignatureRequestDocumentsRepository>
  acknowledgementsRepository: MockProxy<FormalizationSignatureDocumentAcknowledgementsRepository>
  requestsRepository: MockProxy<FormalizationSignatureRequestsRepository>
  protocolsRepository: MockProxy<FormalizationSignatureProtocolsRepository>
  assignmentsRepository: MockProxy<FormalizationSignatureRecipientDocumentsRepository>
  bindingsRepository: MockProxy<FormalizationSignatureProxyBindingsRepository>
  sourceReader: MockProxy<FormalizationSignatureSourceReader>
  hasher: MockProxy<SignatureSecretHasher>
  secretGenerator: MockProxy<{ generate(): string }>
  datetimeProvider: MockProxy<DatetimeProvider>
}

function makeDependencies(): Dependencies {
  const dependencies: Dependencies = {
    sessionsRepository: mock<FormalizationSignatureGatewaySessionsRepository>(),
    recipientsRepository: mock<FormalizationSignatureRecipientsRepository>(),
    documentsRepository: mock<FormalizationSignatureRequestDocumentsRepository>(),
    acknowledgementsRepository:
      mock<FormalizationSignatureDocumentAcknowledgementsRepository>(),
    requestsRepository: mock<FormalizationSignatureRequestsRepository>(),
    protocolsRepository: mock<FormalizationSignatureProtocolsRepository>(),
    assignmentsRepository: mock<FormalizationSignatureRecipientDocumentsRepository>(),
    bindingsRepository: mock<FormalizationSignatureProxyBindingsRepository>(),
    sourceReader: mock<FormalizationSignatureSourceReader>(),
    hasher: mock<SignatureSecretHasher>(),
    secretGenerator: mock<{ generate(): string }>(),
    datetimeProvider: mock<DatetimeProvider>(),
  }
  dependencies.datetimeProvider.now.mockReturnValue(NOW)
  dependencies.hasher.hash.mockImplementation((value) => `${value}-hash`)
  dependencies.secretGenerator.generate.mockReturnValue('fresh-csrf')
  dependencies.sessionsRepository.replace.mockResolvedValue(true)
  dependencies.bindingsRepository.findActiveByRecipientId.mockResolvedValue([])
  dependencies.sessionsRepository.findByTokenHash.mockResolvedValue(
    fakeFormalizationSignatureGatewaySession({
      id: 'session-1',
      requestId: 'request-1',
      recipientId: 'recipient-1',
      snapshotId: 'snapshot-1',
      kind: 'authenticated',
      status: 'active',
      tokenHash: 'token-hash',
      deviceSecretHash: 'device-hash',
      expiresAt: new Date(NOW.getTime() + 60_000),
    }),
  )
  dependencies.requestsRepository.findById.mockResolvedValue(
    fakeFormalizationSignatureRequest({
      id: 'request-1',
      formalizationId: 'formalization-1',
      snapshotId: 'snapshot-1',
      status: 'in_progress',
      version: 7,
    }),
  )
  dependencies.recipientsRepository.findById.mockResolvedValue(
    fakeFormalizationSignatureRecipient({
      id: 'recipient-1',
      requestId: 'request-1',
      personId: 'person-1',
      actorKind: 'client',
      status: 'reading',
    }),
  )
  dependencies.documentsRepository.listByRequestId.mockResolvedValue([
    fakeFormalizationSignatureRequestDocument({
      id: 'document-1',
      requestId: 'request-1',
      sourceDocumentId: 'source-document-1',
      sourceDocumentVersionId: 'source-version-1',
      status: 'provisioned',
      position: 1,
    }),
  ])
  dependencies.sourceReader.findAuthenticationSource.mockResolvedValue({
    personId: 'person-1',
    actorKind: 'client',
    active: true,
    channels: [{ id: 'channel-1', kind: 'email', maskedDestination: 'p***@example.com' }],
  })
  dependencies.sourceReader.findDocumentVersion.mockResolvedValue({
    documentId: 'source-document-1',
    documentVersionId: 'source-version-1',
    name: 'Contrato imutável',
    reviewStatus: 'approved',
    fileId: 'source-file-1',
  })
  dependencies.protocolsRepository.findByRecipientAndRequest.mockResolvedValue(
    fakeFormalizationSignatureProtocol({
      requestId: 'request-1',
      recipientId: 'recipient-1',
      number: 'PRO-123',
    }),
  )
  dependencies.acknowledgementsRepository.listByRecipientAndSnapshot.mockResolvedValue([])
  return dependencies
}

function execute(dependencies: Dependencies) {
  return new GetSignatureGatewayContextUseCase(dependencies).execute({
    sessionToken: 'token',
    deviceToken: 'device',
  })
}

describe('Get Signature Gateway Context Use Case', () => {
  it.each([
    { label: 'revoked', status: 'revoked' as const },
    { label: 'expired', status: 'expired' as const },
  ])('rejects a $label or unexpired-device violation before loading state', async ({
    status,
  }) => {
    const dependencies = makeDependencies()
    dependencies.sessionsRepository.findByTokenHash.mockResolvedValue(
      fakeFormalizationSignatureGatewaySession({
        kind: 'authenticated',
        status,
        expiresAt: new Date(NOW.getTime() + 60_000),
      }),
    )

    await expect(execute(dependencies)).rejects.toThrow()
    expect(dependencies.requestsRepository.findById).not.toHaveBeenCalled()
  })

  it('rejects an exactly-at-expiry session and a different device', async () => {
    const dependencies = makeDependencies()
    dependencies.sessionsRepository.findByTokenHash.mockResolvedValue(
      fakeFormalizationSignatureGatewaySession({
        expiresAt: NOW,
        kind: 'authenticated',
      }),
    )
    await expect(execute(dependencies)).rejects.toThrow()

    dependencies.sessionsRepository.findByTokenHash.mockResolvedValue(
      fakeFormalizationSignatureGatewaySession({
        expiresAt: new Date(NOW.getTime() + 60_000),
        kind: 'authenticated',
      }),
    )
    await expect(execute(dependencies)).rejects.toThrow()
    expect(dependencies.requestsRepository.findById).not.toHaveBeenCalled()
  })

  it.each([
    ['missing request', 'missing-request'],
    ['stale snapshot', 'stale-snapshot'],
    ['foreign recipient', 'foreign-recipient'],
  ] as const)('redacts %s membership without returning an unusable CSRF value', async (_label, drift) => {
    const dependencies = makeDependencies()
    if (drift === 'missing-request')
      dependencies.requestsRepository.findById.mockResolvedValue(null)
    if (drift === 'stale-snapshot')
      dependencies.requestsRepository.findById.mockResolvedValue(
        fakeFormalizationSignatureRequest({
          id: 'request-1',
          snapshotId: 'other-snapshot',
          status: 'in_progress',
        }),
      )
    if (drift === 'foreign-recipient')
      dependencies.recipientsRepository.findById.mockResolvedValue(
        fakeFormalizationSignatureRecipient({
          id: 'recipient-1',
          requestId: 'other-request',
        }),
      )

    await expect(execute(dependencies)).resolves.toEqual({
      step: 'unavailable',
      reason: 'document_unavailable',
    })
    expect(dependencies.sessionsRepository.replace).not.toHaveBeenCalled()
  })

  it('fails closed when optimistic CSRF rotation conflicts', async () => {
    const dependencies = makeDependencies()
    dependencies.sessionsRepository.replace.mockResolvedValue(false)

    await expect(execute(dependencies)).rejects.toThrow()
    expect(dependencies.documentsRepository.listByRequestId).not.toHaveBeenCalled()
  })

  it('returns the package reading context in immutable document order', async () => {
    const dependencies = makeDependencies()
    dependencies.documentsRepository.listByRequestId.mockResolvedValue([
      fakeFormalizationSignatureRequestDocument({
        id: 'document-2',
        requestId: 'request-1',
        sourceDocumentId: 'source-document-2',
        sourceDocumentVersionId: 'source-version-2',
        position: 2,
        status: 'sent',
      }),
      fakeFormalizationSignatureRequestDocument({
        id: 'document-1',
        requestId: 'request-1',
        sourceDocumentId: 'source-document-1',
        sourceDocumentVersionId: 'source-version-1',
        position: 1,
        status: 'provisioned',
      }),
    ])
    dependencies.sourceReader.findDocumentVersion.mockImplementation(
      async (_formalizationId, versionId) => ({
        documentId: versionId.replace('version', 'document'),
        documentVersionId: versionId,
        name: versionId,
        reviewStatus: 'approved',
        fileId: `${versionId}-file`,
      }),
    )
    dependencies.acknowledgementsRepository.listByRecipientAndSnapshot.mockResolvedValue([
      {
        id: 'ack-1',
        requestId: 'request-1',
        requestDocumentId: 'document-1',
        recipientId: 'recipient-1',
        snapshotId: 'snapshot-1',
        sessionId: 'session-1',
        acknowledgedAt: NOW,
        createdAt: NOW,
      },
      {
        id: 'foreign-ack',
        requestId: 'foreign-request',
        requestDocumentId: 'document-2',
        recipientId: 'recipient-1',
        snapshotId: 'snapshot-1',
        sessionId: 'session-1',
        acknowledgedAt: NOW,
        createdAt: NOW,
      },
    ])

    await expect(execute(dependencies)).resolves.toMatchObject({
      step: 'reading',
      documents: [
        { id: 'document-1', position: 1 },
        { id: 'document-2', position: 2 },
      ],
      acknowledgedDocumentIds: ['document-1'],
      requestVersion: 7,
      csrfToken: 'fresh-csrf',
    })
  })

  it('returns only documents assigned to an authenticated collaborator', async () => {
    const dependencies = makeDependencies()
    dependencies.recipientsRepository.findById.mockResolvedValue(
      fakeFormalizationSignatureRecipient({
        id: 'recipient-1',
        requestId: 'request-1',
        personId: 'collaborator-1',
        actorKind: 'collaborator',
        status: 'reading',
      }),
    )
    dependencies.sourceReader.findAuthenticationSource.mockResolvedValue({
      personId: 'collaborator-1',
      actorKind: 'collaborator',
      active: true,
      collaboratorRole: 'lawyer',
      channels: [],
    })
    dependencies.assignmentsRepository.listByRecipientId.mockResolvedValue([
      {
        id: 'assignment-1',
        requestId: 'request-1',
        recipientId: 'recipient-1',
        requestDocumentId: 'document-1',
        createdAt: NOW,
      },
    ])
    dependencies.documentsRepository.listByRequestId.mockResolvedValue([
      fakeFormalizationSignatureRequestDocument({
        id: 'document-1',
        requestId: 'request-1',
        sourceDocumentId: 'source-document-1',
        sourceDocumentVersionId: 'source-version-1',
        position: 1,
        status: 'provisioned',
      }),
      fakeFormalizationSignatureRequestDocument({
        id: 'document-2',
        requestId: 'request-1',
        sourceDocumentId: 'source-document-2',
        sourceDocumentVersionId: 'source-version-2',
        position: 2,
        status: 'provisioned',
      }),
    ])
    dependencies.sourceReader.findDocumentVersion.mockImplementation(
      async (_formalizationId, versionId) => ({
        documentId: versionId.replace('version', 'document'),
        documentVersionId: versionId,
        name: versionId,
        reviewStatus: 'approved',
        fileId: `${versionId}-file`,
      }),
    )

    await expect(
      new GetSignatureGatewayContextUseCase(dependencies).execute({
        sessionToken: 'token',
        deviceToken: 'device',
        actorId: 'collaborator-1',
      }),
    ).resolves.toMatchObject({
      step: 'reading',
      documents: [{ id: 'document-1', position: 1 }],
      csrfToken: 'fresh-csrf',
    })
  })

  it('ignores a coexisting HMS actor for a client OTP session', async () => {
    const dependencies = makeDependencies()

    await expect(
      new GetSignatureGatewayContextUseCase(dependencies).execute({
        sessionToken: 'token',
        deviceToken: 'device',
        actorId: 'signed-in-admin',
      }),
    ).resolves.toMatchObject({ step: 'reading', csrfToken: 'fresh-csrf' })
  })

  it.each([
    'missing',
    'foreign',
    'duplicate',
  ] as const)('fails closed for a %s package document graph', async (drift) => {
    const dependencies = makeDependencies()
    const document = fakeFormalizationSignatureRequestDocument({
      id: 'document-1',
      requestId: drift === 'foreign' ? 'other-request' : 'request-1',
      sourceDocumentId: 'source-document-1',
      sourceDocumentVersionId: 'source-version-1',
      status: 'provisioned',
      position: 1,
    })
    dependencies.documentsRepository.listByRequestId.mockResolvedValue(
      drift === 'missing'
        ? []
        : drift === 'duplicate'
          ? [document, document]
          : [document],
    )

    await expect(execute(dependencies)).resolves.toMatchObject({
      step: 'unavailable',
      reason: 'document_unavailable',
      csrfToken: 'fresh-csrf',
    })
    expect(dependencies.bindingsRepository.findActiveByRecipientId).not.toHaveBeenCalled()
  })

  it.each([
    {
      requestStatus: 'sent' as const,
      recipientStatus: 'submitted' as const,
      expected: 'submitted' as const,
    },
    {
      requestStatus: 'reconciliation_required' as const,
      recipientStatus: 'submitted' as const,
      expected: 'reconciliation_pending' as const,
    },
    {
      requestStatus: 'confirmed' as const,
      recipientStatus: 'confirmed' as const,
      expected: 'confirmed' as const,
    },
    {
      requestStatus: 'rejected' as const,
      recipientStatus: 'reading' as const,
      expected: 'rejected' as const,
    },
    {
      requestStatus: 'sent' as const,
      recipientStatus: 'cancelled' as const,
      expected: 'cancelled' as const,
    },
    {
      requestStatus: 'expired' as const,
      recipientStatus: 'reading' as const,
      expected: 'expired' as const,
    },
  ])('derives $expected from the freshly loaded result graph', async ({
    requestStatus,
    recipientStatus,
    expected,
  }) => {
    const dependencies = makeDependencies()
    dependencies.sessionsRepository.findByTokenHash.mockResolvedValue(
      fakeFormalizationSignatureGatewaySession({
        kind: 'result',
        requestId: 'request-1',
        recipientId: 'recipient-1',
        snapshotId: 'snapshot-1',
        deviceSecretHash: 'device-hash',
        expiresAt: new Date(NOW.getTime() + 60_000),
      }),
    )
    dependencies.requestsRepository.findById.mockResolvedValue(
      fakeFormalizationSignatureRequest({
        id: 'request-1',
        snapshotId: 'snapshot-1',
        status: requestStatus,
      }),
    )
    dependencies.recipientsRepository.findById.mockResolvedValue(
      fakeFormalizationSignatureRecipient({
        id: 'recipient-1',
        requestId: 'request-1',
        status: recipientStatus,
      }),
    )

    const result = await execute(dependencies)
    if (expected === 'confirmed') {
      expect(result).toEqual({
        csrfToken: 'fresh-csrf',
        step: 'confirmed',
        result: { status: expected, hmsReference: 'request-1', protocol: 'PRO-123' },
      })
      expect(
        dependencies.protocolsRepository.findByRecipientAndRequest,
      ).toHaveBeenCalledTimes(1)
    } else if (expected === 'submitted') {
      expect(result).toEqual({
        csrfToken: 'fresh-csrf',
        step: 'submitted',
        result: { status: expected, hmsReference: 'request-1' },
      })
      expect(
        dependencies.protocolsRepository.findByRecipientAndRequest,
      ).not.toHaveBeenCalled()
    } else if (expected === 'reconciliation_pending') {
      expect(result).toEqual({
        csrfToken: 'fresh-csrf',
        step: 'unavailable',
        reason: 'provider_unavailable',
        result: { status: expected, hmsReference: 'request-1' },
      })
    } else {
      expect(result).toEqual({
        csrfToken: 'fresh-csrf',
        step: 'unavailable',
        reason: expected,
        result: { status: expected, hmsReference: 'request-1' },
      })
    }
  })

  it('keeps pre-authentication terminal context generic and redacted', async () => {
    const dependencies = makeDependencies()
    dependencies.sessionsRepository.findByTokenHash.mockResolvedValue(
      fakeFormalizationSignatureGatewaySession({
        kind: 'flow',
        requestId: 'request-1',
        recipientId: 'recipient-1',
        snapshotId: 'snapshot-1',
        deviceSecretHash: 'device-hash',
        expiresAt: new Date(NOW.getTime() + 60_000),
      }),
    )
    dependencies.requestsRepository.findById.mockResolvedValue(
      fakeFormalizationSignatureRequest({
        id: 'request-1',
        snapshotId: 'snapshot-1',
        status: 'cancelled',
      }),
    )
    dependencies.recipientsRepository.findById.mockResolvedValue(
      fakeFormalizationSignatureRecipient({ id: 'recipient-1', requestId: 'request-1' }),
    )

    const result = await execute(dependencies)
    expect(result).toEqual({
      csrfToken: 'fresh-csrf',
      step: 'unavailable',
      reason: 'access_unavailable',
    })
    expect(result).not.toHaveProperty('result')
    expect(JSON.stringify(result)).not.toContain('request-1')
  })

  it('allows a client flow to choose its channel while delivery is sending', async () => {
    const dependencies = makeDependencies()
    dependencies.sessionsRepository.findByTokenHash.mockResolvedValue(
      fakeFormalizationSignatureGatewaySession({
        kind: 'flow',
        requestId: 'request-1',
        recipientId: 'recipient-1',
        snapshotId: 'snapshot-1',
        deviceSecretHash: 'device-hash',
        expiresAt: new Date(NOW.getTime() + 60_000),
      }),
    )
    dependencies.requestsRepository.findById.mockResolvedValue(
      fakeFormalizationSignatureRequest({
        id: 'request-1',
        snapshotId: 'snapshot-1',
        status: 'sending',
      }),
    )
    dependencies.recipientsRepository.findById.mockResolvedValue(
      fakeFormalizationSignatureRecipient({
        id: 'recipient-1',
        requestId: 'request-1',
        personId: 'person-1',
        actorKind: 'client',
        status: 'invited',
      }),
    )

    await expect(execute(dependencies)).resolves.toEqual({
      step: 'choose_channel',
      channels: [
        { id: 'channel-1', kind: 'email', maskedDestination: 'p***@example.com' },
      ],
      csrfToken: 'fresh-csrf',
    })
  })

  it('allows a collaborator flow to reach login while delivery is sending', async () => {
    const dependencies = makeDependencies()
    dependencies.sessionsRepository.findByTokenHash.mockResolvedValue(
      fakeFormalizationSignatureGatewaySession({
        kind: 'flow',
        requestId: 'request-1',
        recipientId: 'recipient-1',
        snapshotId: 'snapshot-1',
        deviceSecretHash: 'device-hash',
        expiresAt: new Date(NOW.getTime() + 60_000),
      }),
    )
    dependencies.requestsRepository.findById.mockResolvedValue(
      fakeFormalizationSignatureRequest({
        id: 'request-1',
        snapshotId: 'snapshot-1',
        status: 'sending',
      }),
    )
    dependencies.recipientsRepository.findById.mockResolvedValue(
      fakeFormalizationSignatureRecipient({
        id: 'recipient-1',
        requestId: 'request-1',
        personId: 'collaborator-1',
        actorKind: 'collaborator',
        status: 'invited',
      }),
    )
    dependencies.sourceReader.findAuthenticationSource.mockResolvedValue({
      personId: 'collaborator-1',
      actorKind: 'collaborator',
      active: true,
      collaboratorRole: 'lawyer',
      channels: [],
    })
    dependencies.assignmentsRepository.listByRecipientId.mockResolvedValue([
      {
        id: 'assignment-1',
        requestId: 'request-1',
        recipientId: 'recipient-1',
        requestDocumentId: 'document-1',
        createdAt: NOW,
      },
    ])

    await expect(execute(dependencies)).resolves.toEqual({
      step: 'collaborator_login',
      loginPath: '/login?returnTo=%2Fassinaturas%2Facesso',
      csrfToken: 'fresh-csrf',
    })
  })

  it('allows a pending collaborator invite after provider reconciliation reports signing', async () => {
    const dependencies = makeDependencies()
    dependencies.sessionsRepository.findByTokenHash.mockResolvedValue(
      fakeFormalizationSignatureGatewaySession({
        kind: 'flow',
        requestId: 'request-1',
        recipientId: 'recipient-1',
        snapshotId: 'snapshot-1',
        deviceSecretHash: 'device-hash',
        expiresAt: new Date(NOW.getTime() + 60_000),
      }),
    )
    dependencies.recipientsRepository.findById.mockResolvedValue(
      fakeFormalizationSignatureRecipient({
        id: 'recipient-1',
        requestId: 'request-1',
        personId: 'collaborator-1',
        actorKind: 'collaborator',
        status: 'signing',
      }),
    )
    dependencies.sourceReader.findAuthenticationSource.mockResolvedValue({
      personId: 'collaborator-1',
      actorKind: 'collaborator',
      active: true,
      collaboratorRole: 'lawyer',
      channels: [],
    })
    dependencies.assignmentsRepository.listByRecipientId.mockResolvedValue([
      {
        id: 'assignment-1',
        requestId: 'request-1',
        recipientId: 'recipient-1',
        requestDocumentId: 'document-1',
        createdAt: NOW,
      },
    ])

    await expect(execute(dependencies)).resolves.toEqual({
      step: 'collaborator_login',
      loginPath: '/login?returnTo=%2Fassinaturas%2Facesso',
      csrfToken: 'fresh-csrf',
    })
  })

  it('recovers signing as fully acknowledged reading without exposing or rotating an alias', async () => {
    const dependencies = makeDependencies()
    dependencies.recipientsRepository.findById.mockResolvedValue(
      fakeFormalizationSignatureRecipient({
        id: 'recipient-1',
        requestId: 'request-1',
        personId: 'person-1',
        actorKind: 'client',
        status: 'signing',
      }),
    )
    dependencies.acknowledgementsRepository.listByRecipientAndSnapshot.mockResolvedValue([
      {
        id: 'ack-1',
        requestId: 'request-1',
        requestDocumentId: 'document-1',
        recipientId: 'recipient-1',
        snapshotId: 'snapshot-1',
        sessionId: 'session-1',
        acknowledgedAt: NOW,
        createdAt: NOW,
      },
    ])
    dependencies.bindingsRepository.findActiveByRecipientId.mockResolvedValue([
      {
        id: 'binding-1',
        sessionId: 'session-1',
        requestId: 'request-1',
        recipientId: 'recipient-1',
        aliasHash: 'opaque-hash',
        encryptedProviderCredential: 'encrypted-secret',
        cipherKeyId: 'key-1',
        providerContractVersion: '2.17.0',
        status: 'active',
        expiresAt: new Date(NOW.getTime() + 60_000),
      },
    ])

    const result = await execute(dependencies)

    expect(result).toMatchObject({
      step: 'reading',
      acknowledgedDocumentIds: ['document-1'],
      csrfToken: 'fresh-csrf',
    })
    expect(result).not.toHaveProperty('proxyPath')
    expect(JSON.stringify(result)).not.toContain('opaque-hash')
    expect(JSON.stringify(result)).not.toContain('encrypted-secret')
    expect(dependencies.sessionsRepository.replace).toHaveBeenCalledOnce()
  })

  it('fails closed when signing recovery has no exact active binding', async () => {
    const dependencies = makeDependencies()
    dependencies.recipientsRepository.findById.mockResolvedValue(
      fakeFormalizationSignatureRecipient({
        id: 'recipient-1',
        requestId: 'request-1',
        personId: 'person-1',
        actorKind: 'client',
        status: 'signing',
      }),
    )
    dependencies.acknowledgementsRepository.listByRecipientAndSnapshot.mockResolvedValue([
      {
        id: 'ack-1',
        requestId: 'request-1',
        requestDocumentId: 'document-1',
        recipientId: 'recipient-1',
        snapshotId: 'snapshot-1',
        sessionId: 'session-1',
        acknowledgedAt: NOW,
        createdAt: NOW,
      },
    ])

    await expect(execute(dependencies)).resolves.toMatchObject({
      step: 'unavailable',
      reason: 'access_unavailable',
      csrfToken: 'fresh-csrf',
    })
  })

  it('requires a live collaborator profile and an exact current assignment before reading', async () => {
    const dependencies = makeDependencies()
    dependencies.recipientsRepository.findById.mockResolvedValue(
      fakeFormalizationSignatureRecipient({
        id: 'recipient-1',
        requestId: 'request-1',
        personId: 'collaborator-1',
        actorKind: 'collaborator',
        status: 'reading',
      }),
    )
    dependencies.sourceReader.findAuthenticationSource.mockResolvedValue({
      personId: 'collaborator-1',
      actorKind: 'collaborator',
      active: true,
      collaboratorRole: 'lawyer',
      channels: [],
    })
    dependencies.assignmentsRepository.listByRecipientId.mockResolvedValue([
      {
        id: 'assignment-1',
        requestId: 'request-1',
        recipientId: 'recipient-1',
        requestDocumentId: 'document-1',
        createdAt: NOW,
      },
    ])

    await expect(
      new GetSignatureGatewayContextUseCase(dependencies).execute({
        sessionToken: 'token',
        deviceToken: 'device',
        actorId: 'collaborator-1',
      }),
    ).resolves.toMatchObject({ step: 'reading', csrfToken: 'fresh-csrf' })

    dependencies.sourceReader.findAuthenticationSource.mockResolvedValue({
      personId: 'collaborator-1',
      actorKind: 'collaborator',
      active: false,
      collaboratorRole: 'lawyer',
      channels: [],
    })
    await expect(execute(dependencies)).resolves.toMatchObject({
      step: 'unavailable',
      reason: 'access_unavailable',
      csrfToken: 'fresh-csrf',
    })
  })
})
