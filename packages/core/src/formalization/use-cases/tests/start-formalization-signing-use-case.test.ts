import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import { StartFormalizationSigningUseCase } from '../start-formalization-signing-use-case'
import {
  fakeFormalizationSignatureGatewaySession,
  fakeFormalizationSignatureRequest,
} from '../../domain/entities/fakers'
import type {
  FormalizationSignatureDocumentAcknowledgementsRepository,
  FormalizationSignatureGatewaySessionsRepository,
  FormalizationSignatureGatewayTransaction,
  FormalizationSignatureProviderRecipientResourcesRepository,
  FormalizationSignatureProviderResourcesRepository,
  FormalizationSignatureProxyBindingsRepository,
  FormalizationSignatureRecipientDocumentsRepository,
  FormalizationSignatureRequestDocumentsRepository,
  FormalizationSignatureRequestsRepository,
  FormalizationSignatureRecipientsRepository,
  FormalizationSignatureSourceReader,
  SignatureProvider,
  SignatureSecretHasher,
} from '../../interfaces'
import type { DatetimeProvider, IdProvider } from '../../../shared/interfaces'

const NOW = new Date('2026-01-01T00:00:00.000Z')

function makeDependencies() {
  const sessions = mock<FormalizationSignatureGatewaySessionsRepository>()
  const requests = mock<FormalizationSignatureRequestsRepository>()
  const recipients = mock<FormalizationSignatureRecipientsRepository>()
  const documents = mock<FormalizationSignatureRequestDocumentsRepository>()
  const assignments = mock<FormalizationSignatureRecipientDocumentsRepository>()
  const acknowledgements =
    mock<FormalizationSignatureDocumentAcknowledgementsRepository>()
  const resources = mock<FormalizationSignatureProviderResourcesRepository>()
  const recipientResources =
    mock<FormalizationSignatureProviderRecipientResourcesRepository>()
  const bindings = mock<FormalizationSignatureProxyBindingsRepository>()
  const provider = mock<SignatureProvider>()
  const transaction = mock<FormalizationSignatureGatewayTransaction>()
  const sourceReader = mock<FormalizationSignatureSourceReader>()
  const hasher = mock<SignatureSecretHasher>()
  const datetimeProvider = mock<DatetimeProvider>()
  datetimeProvider.now.mockReturnValue(NOW)
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
  documents.listByRequestId.mockResolvedValue([
    {
      id: 'document-1',
      requestId: 'request-1',
      sourceDocumentId: 'source-1',
      sourceDocumentVersionId: 'version-1',
      signaturePreviewId: 'preview-1',
      unsignedPrivateFileId: 'file-1',
      unsignedSha256: 'hash-1',
      byteCount: 1,
      pageCount: 1,
      position: 0,
      status: 'provisioned',
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'document-2',
      requestId: 'request-1',
      sourceDocumentId: 'source-2',
      sourceDocumentVersionId: 'version-2',
      signaturePreviewId: 'preview-2',
      unsignedPrivateFileId: 'file-2',
      unsignedSha256: 'hash-2',
      byteCount: 1,
      pageCount: 1,
      position: 1,
      status: 'provisioned',
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ])
  assignments.listByRecipientId.mockResolvedValue([
    {
      id: 'assignment-1',
      requestId: 'request-1',
      recipientId: 'recipient-1',
      requestDocumentId: 'document-1',
      createdAt: new Date(),
    },
  ])
  resources.findByRequestId.mockResolvedValue({
    id: 'provider-resource-1',
    requestId: 'request-1',
    provider: 'documenso',
    providerContractVersion: '2.17.0',
    providerEnvelopeId: 'envelope-1',
    providerExternalId: 'request-1',
    idempotencyKey: 'request-1',
    createdAt: new Date(),
  })
  recipientResources.findByRecipientId.mockResolvedValue({
    id: 'provider-recipient-resource-1',
    requestId: 'request-1',
    providerResourceId: 'provider-resource-1',
    recipientId: 'recipient-1',
    providerRecipientId: 'provider-recipient-1',
    encryptedSigningCredential: 'encrypted',
    cipherKeyId: 'key-1',
    createdAt: new Date(),
  })
  bindings.findActiveByRecipientId.mockResolvedValue([])
  provider.createSigningBinding.mockResolvedValue({
    encryptedCredential: 'encrypted',
    cipherKeyId: 'key-1',
    expiresAt: new Date('2026-09-04T00:00:00.000Z'),
  })
  provider.getContractVersion.mockReturnValue('2.17.0')
  transaction.startProviderEntry.mockResolvedValue('created')
  return {
    sessions,
    requests,
    recipients,
    documents,
    assignments,
    acknowledgements,
    resources,
    recipientResources,
    bindings,
    provider,
    transaction,
    sourceReader,
    hasher,
    datetimeProvider,
  }
}

function createUseCase(dependencies: ReturnType<typeof makeDependencies>) {
  return new StartFormalizationSigningUseCase({
    sessionsRepository: dependencies.sessions,
    requestsRepository: dependencies.requests,
    recipientsRepository: dependencies.recipients,
    documentsRepository: dependencies.documents,
    assignmentsRepository: dependencies.assignments,
    acknowledgementsRepository: dependencies.acknowledgements,
    providerResourcesRepository: dependencies.resources,
    providerRecipientResourcesRepository: dependencies.recipientResources,
    bindingsRepository: dependencies.bindings,
    transaction: dependencies.transaction,
    provider: dependencies.provider,
    sourceReader: dependencies.sourceReader,
    datetimeProvider: dependencies.datetimeProvider,
    hasher: dependencies.hasher,
    idProvider: { generate: () => 'binding-1' } as IdProvider,
    secretGenerator: { generate: () => 'alias-1' },
  })
}

describe('Start Formalization Signing Use Case', () => {
  it.each([
    ['missing session', null],
    [
      'wrong session kind',
      fakeFormalizationSignatureGatewaySession({
        kind: 'flow',
        status: 'active',
        deviceSecretHash: 'device-hash',
        csrfHash: 'csrf-hash',
      }),
    ],
    [
      'revoked session',
      fakeFormalizationSignatureGatewaySession({
        kind: 'authenticated',
        status: 'revoked',
        deviceSecretHash: 'device-hash',
        csrfHash: 'csrf-hash',
      }),
    ],
    [
      'expired session',
      fakeFormalizationSignatureGatewaySession({
        kind: 'authenticated',
        status: 'active',
        deviceSecretHash: 'device-hash',
        csrfHash: 'csrf-hash',
        expiresAt: NOW,
      }),
    ],
    [
      'wrong device',
      fakeFormalizationSignatureGatewaySession({
        kind: 'authenticated',
        status: 'active',
        deviceSecretHash: 'other-hash',
        csrfHash: 'csrf-hash',
      }),
    ],
    [
      'wrong csrf',
      fakeFormalizationSignatureGatewaySession({
        kind: 'authenticated',
        status: 'active',
        deviceSecretHash: 'device-hash',
        csrfHash: 'other-hash',
      }),
    ],
  ] as const)('fails closed for %s without provider or binding side effects', async (_label, session) => {
    const dependencies = makeDependencies()
    dependencies.sessions.findByTokenHash.mockResolvedValueOnce(session)
    await expect(
      createUseCase(dependencies).execute({
        sessionToken: 'session',
        deviceToken: 'device',
        csrfToken: 'csrf',
        expectedRequestVersion: 3,
        actorId: 'person-1',
      }),
    ).rejects.toThrow()
    expect(dependencies.provider.createSigningBinding).not.toHaveBeenCalled()
    expect(dependencies.transaction.startProviderEntry).not.toHaveBeenCalled()
  })

  it.each([
    ['missing recipient', null, undefined],
    [
      'foreign recipient',
      {
        id: 'recipient-1',
        requestId: 'request-2',
        personId: 'person-1',
        actorKind: 'client',
        status: 'reading',
        version: 1,
        signatoryId: 's',
        displayNameSnapshot: 'Foreign',
        deliveryChannel: 'email',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      undefined,
    ],
    ['inactive identity', undefined, 'person-1'],
    ['kind-mismatched identity', undefined, 'person-1'],
  ] as const)('fails closed for %s before provider entry', async (label, recipient, actorId) => {
    const dependencies = makeDependencies()
    if (recipient !== undefined)
      dependencies.recipients.findById.mockResolvedValueOnce(recipient)
    if (label === 'inactive identity')
      dependencies.sourceReader.findAuthenticationSource.mockResolvedValueOnce(null)
    if (label === 'kind-mismatched identity')
      dependencies.sourceReader.findAuthenticationSource.mockResolvedValueOnce({
        personId: 'person-1',
        actorKind: 'collaborator',
        active: true,
        channels: [],
      })
    await expect(
      createUseCase(dependencies).execute({
        sessionToken: 'session',
        deviceToken: 'device',
        csrfToken: 'csrf',
        expectedRequestVersion: 3,
        actorId: actorId ?? 'person-1',
      }),
    ).rejects.toThrow()
    expect(dependencies.provider.createSigningBinding).not.toHaveBeenCalled()
  })

  it('requires an explicit actor for a collaborator recipient', async () => {
    const dependencies = makeDependencies()
    dependencies.recipients.findById.mockResolvedValueOnce({
      id: 'recipient-1',
      requestId: 'request-1',
      personId: 'collaborator-1',
      actorKind: 'collaborator',
      status: 'reading',
      version: 1,
      signatoryId: 's',
      displayNameSnapshot: 'Collaborator',
      deliveryChannel: 'email',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    dependencies.sourceReader.findAuthenticationSource.mockResolvedValueOnce({
      personId: 'collaborator-1',
      actorKind: 'collaborator',
      active: true,
      channels: [],
    })
    await expect(
      createUseCase(dependencies).execute({
        sessionToken: 'session',
        deviceToken: 'device',
        csrfToken: 'csrf',
        expectedRequestVersion: 3,
      }),
    ).rejects.toThrow()
    expect(dependencies.provider.createSigningBinding).not.toHaveBeenCalled()
  })

  it.each([
    ['foreign acknowledgement', ['foreign-request:document-1', 'request-1:document-2']],
    [
      'duplicate acknowledgement',
      ['request-1:document-1', 'request-1:document-1', 'request-1:document-2'],
    ],
  ] as const)('rejects %s without provider or binding writes', async (_label, keys) => {
    const dependencies = makeDependencies()
    dependencies.acknowledgements.listByRecipientAndSnapshot.mockResolvedValueOnce(
      keys.map((key, index) => {
        const [requestId, requestDocumentId] = key.split(':')
        return {
          id: `ack-${index}`,
          requestId,
          requestDocumentId,
          recipientId: 'recipient-1',
          snapshotId: 'snapshot-1',
          sessionId: 'session-1',
          acknowledgedAt: new Date(),
          createdAt: new Date(),
        }
      }),
    )
    await expect(
      createUseCase(dependencies).execute({
        sessionToken: 'session',
        deviceToken: 'device',
        csrfToken: 'csrf',
        expectedRequestVersion: 3,
        actorId: 'person-1',
      }),
    ).rejects.toThrow()
    expect(dependencies.provider.createSigningBinding).not.toHaveBeenCalled()
    expect(dependencies.transaction.startProviderEntry).not.toHaveBeenCalled()
  })

  it('rejects duplicate request documents and assignments before provider entry', async () => {
    const dependencies = makeDependencies()
    dependencies.documents.listByRequestId.mockResolvedValueOnce([
      {
        id: 'document-1',
        requestId: 'request-1',
        sourceDocumentId: 'source-1',
        sourceDocumentVersionId: 'version-1',
        signaturePreviewId: 'preview-1',
        unsignedPrivateFileId: 'file-1',
        unsignedSha256: 'hash-1',
        byteCount: 1,
        pageCount: 1,
        position: 0,
        status: 'provisioned',
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'document-1',
        requestId: 'request-1',
        sourceDocumentId: 'source-1',
        sourceDocumentVersionId: 'version-1',
        signaturePreviewId: 'preview-1',
        unsignedPrivateFileId: 'file-1',
        unsignedSha256: 'hash-1',
        byteCount: 1,
        pageCount: 1,
        position: 0,
        status: 'provisioned',
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ])
    await expect(
      createUseCase(dependencies).execute({
        sessionToken: 'session',
        deviceToken: 'device',
        csrfToken: 'csrf',
        expectedRequestVersion: 3,
        actorId: 'person-1',
      }),
    ).rejects.toThrow()
    expect(dependencies.provider.createSigningBinding).not.toHaveBeenCalled()
  })

  it.each([
    'missing recipient resource',
    'foreign recipient resource',
  ] as const)('rejects %s', async (label) => {
    const dependencies = makeDependencies()
    dependencies.acknowledgements.listByRecipientAndSnapshot.mockResolvedValue(
      ['document-1', 'document-2'].map((requestDocumentId) => ({
        id: `ack-${requestDocumentId}`,
        requestId: 'request-1',
        requestDocumentId,
        recipientId: 'recipient-1',
        snapshotId: 'snapshot-1',
        sessionId: 'session-1',
        acknowledgedAt: new Date(),
        createdAt: new Date(),
      })),
    )
    dependencies.recipientResources.findByRecipientId.mockResolvedValueOnce(
      label === 'missing recipient resource'
        ? null
        : ({
            requestId: 'request-2',
            recipientId: 'recipient-1',
            providerResourceId: 'provider-resource-1',
            providerRecipientId: 'provider-recipient-1',
          } as never),
    )
    await expect(
      createUseCase(dependencies).execute({
        sessionToken: 'session',
        deviceToken: 'device',
        csrfToken: 'csrf',
        expectedRequestVersion: 3,
        actorId: 'person-1',
      }),
    ).rejects.toThrow()
    expect(dependencies.provider.createSigningBinding).not.toHaveBeenCalled()
  })

  it('returns no provider path when the atomic create conflicts', async () => {
    const dependencies = makeDependencies()
    dependencies.acknowledgements.listByRecipientAndSnapshot.mockResolvedValue(
      ['document-1', 'document-2'].map((requestDocumentId) => ({
        id: `ack-${requestDocumentId}`,
        requestId: 'request-1',
        requestDocumentId,
        recipientId: 'recipient-1',
        snapshotId: 'snapshot-1',
        sessionId: 'session-1',
        acknowledgedAt: new Date(),
        createdAt: new Date(),
      })),
    )
    dependencies.transaction.startProviderEntry.mockResolvedValueOnce('conflict')

    await expect(
      createUseCase(dependencies).execute({
        sessionToken: 'session',
        deviceToken: 'device',
        csrfToken: 'csrf',
        expectedRequestVersion: 3,
        actorId: 'person-1',
      }),
    ).rejects.toThrow()

    expect(dependencies.provider.createSigningBinding).toHaveBeenCalledOnce()
    expect(dependencies.provider.createEnvelope).not.toHaveBeenCalled()
    expect(dependencies.provider.distributeEnvelope).not.toHaveBeenCalled()
    expect(dependencies.transaction.startProviderEntry).toHaveBeenCalledOnce()
  })

  it('rejects an expired provider credential without persisting a binding', async () => {
    const dependencies = makeDependencies()
    dependencies.acknowledgements.listByRecipientAndSnapshot.mockResolvedValueOnce(
      ['document-1', 'document-2'].map((requestDocumentId) => ({
        id: `ack-${requestDocumentId}`,
        requestId: 'request-1',
        requestDocumentId,
        recipientId: 'recipient-1',
        snapshotId: 'snapshot-1',
        sessionId: 'session-1',
        acknowledgedAt: new Date(),
        createdAt: new Date(),
      })),
    )
    dependencies.provider.createSigningBinding.mockResolvedValueOnce({
      encryptedCredential: 'encrypted',
      cipherKeyId: 'key-1',
      expiresAt: NOW,
    })

    await expect(
      createUseCase(dependencies).execute({
        sessionToken: 'session',
        deviceToken: 'device',
        csrfToken: 'csrf',
        expectedRequestVersion: 3,
        actorId: 'person-1',
      }),
    ).rejects.toThrow()
    expect(dependencies.transaction.startProviderEntry).not.toHaveBeenCalled()
  })

  it.each([
    ['provisioning', 'request'],
    ['sent', 'request'],
    ['signing', 'recipient'],
    ['submitted', 'recipient'],
    ['reconciliation_required', 'recipient'],
  ] as const)('fails closed for non-signable %s state', async (status, owner) => {
    const dependencies = makeDependencies()
    if (owner === 'request') {
      dependencies.requests.findById.mockResolvedValueOnce(
        fakeFormalizationSignatureRequest({
          id: 'request-1',
          version: 3,
          snapshotId: 'snapshot-1',
          status,
        }),
      )
    } else {
      dependencies.recipients.findById.mockResolvedValueOnce({
        id: 'recipient-1',
        requestId: 'request-1',
        signatoryId: 'signatory-1',
        personId: 'person-1',
        actorKind: 'client',
        displayNameSnapshot: 'Client',
        deliveryChannel: 'email',
        status,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }
    await expect(
      createUseCase(dependencies).execute({
        sessionToken: 'session',
        deviceToken: 'device',
        csrfToken: 'csrf',
        expectedRequestVersion: 3,
        actorId: 'person-1',
      }),
    ).rejects.toThrow()
    expect(dependencies.provider.createSigningBinding).not.toHaveBeenCalled()
  })

  it.each([
    ['zero', []],
    ['partial', ['document-1']],
  ])('rejects %s package acknowledgements', async (_label, acknowledgedIds) => {
    const dependencies = makeDependencies()
    dependencies.acknowledgements.listByRecipientAndSnapshot.mockResolvedValue(
      acknowledgedIds.map((requestDocumentId) => ({
        id: `ack-${requestDocumentId}`,
        requestId: 'request-1',
        requestDocumentId,
        recipientId: 'recipient-1',
        snapshotId: 'snapshot-1',
        sessionId: 'session-1',
        acknowledgedAt: new Date(),
        createdAt: new Date(),
      })),
    )
    await expect(
      createUseCase(dependencies).execute({
        sessionToken: 'session',
        deviceToken: 'device',
        csrfToken: 'csrf',
        expectedRequestVersion: 3,
        actorId: 'person-1',
      }),
    ).rejects.toThrow()
    expect(dependencies.provider.createSigningBinding).not.toHaveBeenCalled()
  })

  it.each([
    'in_progress',
    'partially_submitted',
  ] as const)('starts the shared envelope while the request is %s', async (requestStatus) => {
    const dependencies = makeDependencies()
    dependencies.requests.findById.mockResolvedValueOnce(
      fakeFormalizationSignatureRequest({
        id: 'request-1',
        version: 3,
        snapshotId: 'snapshot-1',
        status: requestStatus,
      }),
    )
    dependencies.acknowledgements.listByRecipientAndSnapshot.mockResolvedValue(
      ['document-1', 'document-2'].map((requestDocumentId) => ({
        id: `ack-${requestDocumentId}`,
        requestId: 'request-1',
        requestDocumentId,
        recipientId: 'recipient-1',
        snapshotId: 'snapshot-1',
        sessionId: 'session-1',
        acknowledgedAt: new Date(),
        createdAt: new Date(),
      })),
    )
    const result = await createUseCase(dependencies).execute({
      sessionToken: 'session',
      deviceToken: 'device',
      csrfToken: 'csrf',
      expectedRequestVersion: 3,
      actorId: 'signed-in-admin',
    })
    expect(result).toMatchObject({
      proxyPath: '/assinaturas/provedor/alias-1/sign/alias-1',
    })
    expect(result).not.toHaveProperty('encryptedCredential')
    expect(result).not.toHaveProperty('cipherKeyId')
    expect(dependencies.provider.createSigningBinding).toHaveBeenCalledWith({
      providerEnvelopeId: 'envelope-1',
      providerRecipientId: 'provider-recipient-1',
      recipientId: 'recipient-1',
    })
    expect(dependencies.transaction.startProviderEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: expect.objectContaining({
          kind: 'create',
          binding: expect.objectContaining({
            encryptedProviderCredential: 'encrypted',
          }),
        }),
        recipientChanges: { status: 'signing' },
      }),
    )
    expect(dependencies.bindings.add).not.toHaveBeenCalled()
  })

  it.each([
    ['stale request version', () => undefined],
    [
      'stale snapshot',
      (dependencies: ReturnType<typeof makeDependencies>) => {
        dependencies.sessions.findByTokenHash.mockResolvedValueOnce(
          fakeFormalizationSignatureGatewaySession({
            requestId: 'request-1',
            recipientId: 'recipient-1',
            snapshotId: 'stale-snapshot',
            kind: 'authenticated',
            status: 'active',
            deviceSecretHash: 'device-hash',
            csrfHash: 'csrf-hash',
          }),
        )
      },
    ],
    [
      'stale identity',
      (dependencies: ReturnType<typeof makeDependencies>) => {
        dependencies.sourceReader.findAuthenticationSource.mockResolvedValueOnce({
          personId: 'person-1',
          actorKind: 'client',
          active: false,
          channels: [],
        })
      },
    ],
    [
      'foreign assignment',
      (dependencies: ReturnType<typeof makeDependencies>) => {
        dependencies.assignments.listByRecipientId.mockResolvedValueOnce([
          {
            id: 'foreign-assignment',
            requestId: 'request-1',
            recipientId: 'recipient-1',
            requestDocumentId: 'foreign-document',
            createdAt: new Date(),
          },
        ])
      },
    ],
    [
      'foreign provider resource',
      (dependencies: ReturnType<typeof makeDependencies>) => {
        dependencies.resources.findByRequestId.mockResolvedValueOnce({
          id: 'provider-resource-1',
          requestId: 'foreign-request',
          provider: 'documenso',
          providerContractVersion: '2.17.0',
          providerEnvelopeId: 'envelope-1',
          providerExternalId: 'foreign-request',
          idempotencyKey: 'foreign-request',
          createdAt: new Date(),
        })
      },
    ],
  ])('fails closed for %s', async (label, mutate) => {
    const dependencies = makeDependencies()
    mutate(dependencies)
    const expectedRequestVersion = label === 'stale request version' ? 2 : 3
    await expect(
      createUseCase(dependencies).execute({
        sessionToken: 'session',
        deviceToken: 'device',
        csrfToken: 'csrf',
        expectedRequestVersion,
        actorId: 'person-1',
      }),
    ).rejects.toThrow()
    expect(dependencies.provider.createSigningBinding).not.toHaveBeenCalled()
  })

  it('rejects a duplicate active binding and never returns the provider credential', async () => {
    const dependencies = makeDependencies()
    dependencies.acknowledgements.listByRecipientAndSnapshot.mockResolvedValue(
      ['document-1', 'document-2'].map((requestDocumentId) => ({
        id: `ack-${requestDocumentId}`,
        requestId: 'request-1',
        requestDocumentId,
        recipientId: 'recipient-1',
        snapshotId: 'snapshot-1',
        sessionId: 'session-1',
        acknowledgedAt: new Date(),
        createdAt: new Date(),
      })),
    )
    dependencies.bindings.findActiveByRecipientId.mockResolvedValue([
      {
        id: 'binding-1',
        sessionId: 'session-1',
        requestId: 'request-1',
        recipientId: 'recipient-1',
        aliasHash: 'alias-hash',
        encryptedProviderCredential: 'encrypted',
        cipherKeyId: 'key-1',
        providerContractVersion: '2.17.0',
        status: 'active',
        expiresAt: new Date(),
      },
    ])
    await expect(
      createUseCase(dependencies).execute({
        sessionToken: 'session',
        deviceToken: 'device',
        csrfToken: 'csrf',
        expectedRequestVersion: 3,
        actorId: 'person-1',
      }),
    ).rejects.toThrow()
    expect(dependencies.provider.createSigningBinding).not.toHaveBeenCalled()
  })

  it('rotates a lost-response alias atomically and reuses the encrypted credential', async () => {
    const dependencies = makeDependencies()
    dependencies.recipients.findById.mockResolvedValueOnce({
      id: 'recipient-1',
      requestId: 'request-1',
      signatoryId: 'signatory-1',
      personId: 'person-1',
      actorKind: 'client',
      displayNameSnapshot: 'Client',
      deliveryChannel: 'email',
      status: 'signing',
      version: 2,
      createdAt: NOW,
      updatedAt: NOW,
    })
    dependencies.acknowledgements.listByRecipientAndSnapshot.mockResolvedValue(
      ['document-1', 'document-2'].map((requestDocumentId) => ({
        id: `ack-${requestDocumentId}`,
        requestId: 'request-1',
        requestDocumentId,
        recipientId: 'recipient-1',
        snapshotId: 'snapshot-1',
        sessionId: 'session-1',
        acknowledgedAt: NOW,
        createdAt: NOW,
      })),
    )
    dependencies.bindings.findActiveByRecipientId.mockResolvedValue([
      {
        id: 'binding-existing',
        sessionId: 'session-1',
        requestId: 'request-1',
        recipientId: 'recipient-1',
        aliasHash: 'old-alias-hash',
        encryptedProviderCredential: 'encrypted-existing',
        cipherKeyId: 'key-existing',
        providerContractVersion: '2.17.0',
        status: 'active',
        expiresAt: new Date('2026-09-04T00:00:00.000Z'),
      },
    ])
    dependencies.transaction.startProviderEntry.mockResolvedValueOnce('rotated')

    const result = await createUseCase(dependencies).execute({
      sessionToken: 'session',
      deviceToken: 'device',
      csrfToken: 'csrf',
      expectedRequestVersion: 3,
      actorId: 'person-1',
    })

    expect(result).toEqual({
      proxyPath: '/assinaturas/provedor/alias-1/sign/alias-1',
      expiresAt: new Date('2026-09-04T00:00:00.000Z'),
    })
    expect(dependencies.provider.createSigningBinding).not.toHaveBeenCalled()
    expect(dependencies.transaction.startProviderEntry).toHaveBeenCalledWith({
      sessionId: 'session-1',
      expectedSessionVersion: expect.any(Number),
      requestId: 'request-1',
      expectedRequestVersion: 3,
      recipientId: 'recipient-1',
      expectedRecipientVersion: 2,
      operation: {
        kind: 'rotate',
        bindingId: 'binding-existing',
        expectedAliasHash: 'old-alias-hash',
        replacementAliasHash: 'alias-1-hash',
        replacementExpiresAt: new Date('2026-09-04T00:00:00.000Z'),
      },
      recipientChanges: { status: 'signing' },
    })
    expect(JSON.stringify(result)).not.toContain('encrypted-existing')
    expect(JSON.stringify(result)).not.toContain('key-existing')
  })

  it.each([
    'missing',
    'foreign',
    'expired',
    'multiple',
    'transaction',
  ] as const)('returns no path for a %s signing-state binding retry', async (failure) => {
    const dependencies = makeDependencies()
    dependencies.recipients.findById.mockResolvedValueOnce({
      id: 'recipient-1',
      requestId: 'request-1',
      signatoryId: 'signatory-1',
      personId: 'person-1',
      actorKind: 'client',
      displayNameSnapshot: 'Client',
      deliveryChannel: 'email',
      status: 'signing',
      version: 2,
      createdAt: NOW,
      updatedAt: NOW,
    })
    dependencies.acknowledgements.listByRecipientAndSnapshot.mockResolvedValue(
      ['document-1', 'document-2'].map((requestDocumentId) => ({
        id: `ack-${requestDocumentId}`,
        requestId: 'request-1',
        requestDocumentId,
        recipientId: 'recipient-1',
        snapshotId: 'snapshot-1',
        sessionId: 'session-1',
        acknowledgedAt: NOW,
        createdAt: NOW,
      })),
    )
    const binding = {
      id: 'binding-existing',
      sessionId: 'session-1',
      requestId: failure === 'foreign' ? 'request-2' : 'request-1',
      recipientId: 'recipient-1',
      aliasHash: 'old-alias-hash',
      encryptedProviderCredential: 'encrypted-existing',
      cipherKeyId: 'key-existing',
      providerContractVersion: '2.17.0',
      status: 'active' as const,
      expiresAt: failure === 'expired' ? NOW : new Date('2026-09-04T00:00:00.000Z'),
    }
    dependencies.bindings.findActiveByRecipientId.mockResolvedValue(
      failure === 'missing'
        ? []
        : failure === 'multiple'
          ? [binding, { ...binding, id: 'binding-2' }]
          : [binding],
    )
    if (failure === 'transaction')
      dependencies.transaction.startProviderEntry.mockResolvedValue('invalid_binding')

    await expect(
      createUseCase(dependencies).execute({
        sessionToken: 'session',
        deviceToken: 'device',
        csrfToken: 'csrf',
        expectedRequestVersion: 3,
        actorId: 'person-1',
      }),
    ).rejects.toThrow()
    expect(dependencies.provider.createSigningBinding).not.toHaveBeenCalled()
    expect(
      JSON.stringify(dependencies.transaction.startProviderEntry.mock.calls),
    ).not.toContain('encrypted-existing')
  })

  it('translates provider binding creation failure and commits nothing', async () => {
    const dependencies = makeDependencies()
    dependencies.acknowledgements.listByRecipientAndSnapshot.mockResolvedValue(
      ['document-1', 'document-2'].map((requestDocumentId) => ({
        id: `ack-${requestDocumentId}`,
        requestId: 'request-1',
        requestDocumentId,
        recipientId: 'recipient-1',
        snapshotId: 'snapshot-1',
        sessionId: 'session-1',
        acknowledgedAt: NOW,
        createdAt: NOW,
      })),
    )
    dependencies.provider.createSigningBinding.mockRejectedValue(
      new Error('provider secret failure'),
    )

    await expect(
      createUseCase(dependencies).execute({
        sessionToken: 'session',
        deviceToken: 'device',
        csrfToken: 'csrf',
        expectedRequestVersion: 3,
        actorId: 'person-1',
      }),
    ).rejects.not.toThrow('provider secret failure')
    expect(dependencies.transaction.startProviderEntry).not.toHaveBeenCalled()
  })
})
