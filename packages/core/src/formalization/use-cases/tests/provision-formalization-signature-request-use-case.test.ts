import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import { ProvisionFormalizationSignatureRequestUseCase } from '../provision-formalization-signature-request-use-case'
import {
  fakeFormalizationSignatureProvisioningAttempt,
  fakeFormalizationSignatureRequest,
} from '../../domain/entities/fakers'
import type {
  FormalizationSignatureConfigurationRepository,
  FormalizationSignatureDocumentContentReader,
  FormalizationSignatureDocumentMetadataReader,
  FormalizationSignatureGatewayTransaction,
  FormalizationSignatureInvitationSendAttemptsRepository,
  FormalizationSignatureInvitationsRepository,
  FormalizationSignatureProviderDocumentResourcesRepository,
  FormalizationSignatureProviderRecipientResourcesRepository,
  FormalizationSignatureProviderResourcesRepository,
  FormalizationSignatureProvisioningAttemptsRepository,
  FormalizationSignatureRecipientDocumentsRepository,
  FormalizationSignatureRecipientsRepository,
  FormalizationSignatureRequestDocumentsRepository,
  FormalizationSignatureRequestsRepository,
  FormalizationSignatureSnapshotsRepository,
  FormalizationSignatureSourceReader,
  SensitivePayloadCipherProvider,
  SignatureProvider,
  SignatureSecretHasher,
} from '../../interfaces'
import type { FormalizationSignatureConfiguration } from '../../domain/structures'
import type { Broker, DatetimeProvider, IdProvider } from '../../../shared/interfaces'

function makeDependencies() {
  const attemptsRepository = mock<FormalizationSignatureProvisioningAttemptsRepository>()
  const requestsRepository = mock<FormalizationSignatureRequestsRepository>()
  const documentsRepository = mock<FormalizationSignatureRequestDocumentsRepository>()
  const recipientsRepository = mock<FormalizationSignatureRecipientsRepository>()
  const recipientDocumentsRepository =
    mock<FormalizationSignatureRecipientDocumentsRepository>()
  const configurationRepository = mock<FormalizationSignatureConfigurationRepository>()
  const snapshotsRepository = mock<FormalizationSignatureSnapshotsRepository>()
  const metadataReader = mock<FormalizationSignatureDocumentMetadataReader>()
  const sourceReader = mock<FormalizationSignatureSourceReader>()
  const contentReader = mock<FormalizationSignatureDocumentContentReader>()
  const providerResourcesRepository =
    mock<FormalizationSignatureProviderResourcesRepository>()
  const providerDocumentResourcesRepository =
    mock<FormalizationSignatureProviderDocumentResourcesRepository>()
  const providerRecipientResourcesRepository =
    mock<FormalizationSignatureProviderRecipientResourcesRepository>()
  const invitationsRepository = mock<FormalizationSignatureInvitationsRepository>()
  const invitationSendAttemptsRepository =
    mock<FormalizationSignatureInvitationSendAttemptsRepository>()
  const transaction = mock<FormalizationSignatureGatewayTransaction>()
  const provider = mock<SignatureProvider>()
  const cipher = mock<SensitivePayloadCipherProvider>()
  const hasher = mock<SignatureSecretHasher>()
  const idProvider = mock<IdProvider>()
  const secretGenerator = { generate: () => 'token-1' }
  const datetimeProvider = mock<DatetimeProvider>()
  const broker = mock<Broker>()
  const request = fakeFormalizationSignatureRequest({
    id: 'request-1',
    formalizationId: 'formalization-1',
    signatureConfigurationVersion: 3,
    snapshotId: 'snapshot-1',
    version: 4,
    status: 'provisioning',
  })
  const attempt = fakeFormalizationSignatureProvisioningAttempt({
    id: 'attempt-1',
    requestId: request.id,
    attemptToken: 'attempt-token',
  })
  attemptsRepository.findByRequestId.mockResolvedValue(attempt)
  requestsRepository.findById.mockResolvedValue(request)
  documentsRepository.listByRequestId.mockResolvedValue([
    {
      id: 'request-document-1',
      requestId: request.id,
      sourceDocumentId: 'source-1',
      sourceDocumentVersionId: 'version-1',
      signaturePreviewId: 'preview-1',
      unsignedPrivateFileId: 'file-1',
      unsignedSha256: 'sha-1',
      byteCount: 10,
      pageCount: 1,
      position: 0,
      status: 'provisioned',
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'request-document-2',
      requestId: request.id,
      sourceDocumentId: 'source-2',
      sourceDocumentVersionId: 'version-2',
      signaturePreviewId: 'preview-2',
      unsignedPrivateFileId: 'file-2',
      unsignedSha256: 'sha-2',
      byteCount: 20,
      pageCount: 2,
      position: 1,
      status: 'provisioned',
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ])
  recipientsRepository.listByRequestId.mockResolvedValue([
    {
      id: 'recipient-1',
      requestId: request.id,
      signatoryId: 'signatory-1',
      personId: 'person-1',
      actorKind: 'client',
      displayNameSnapshot: 'Client',
      deliveryChannel: 'email',
      status: 'invited',
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ])
  recipientDocumentsRepository.listByRequestId.mockResolvedValue([
    {
      id: 'assignment-1',
      requestId: request.id,
      recipientId: 'recipient-1',
      requestDocumentId: 'request-document-1',
      createdAt: new Date(),
    },
    {
      id: 'assignment-2',
      requestId: request.id,
      recipientId: 'recipient-1',
      requestDocumentId: 'request-document-2',
      createdAt: new Date(),
    },
  ])
  configurationRepository.findByFormalizationId.mockResolvedValue({
    formalizationId: 'formalization-1',
    version: 3,
    editable: true,
    status: 'ready_for_sending',
    previewPreparation: { total: 2, pending: 0, processing: 0, ready: 2, failed: 0 },
    signatories: [
      {
        signatoryId: 'signatory-1',
        personId: 'person-1',
        role: 'client',
        name: 'Client',
        removable: false,
        availableChannels: [],
        selectedChannels: ['email'],
        documentIds: ['source-1', 'source-2'],
      },
    ],
    documents: [
      {
        documentId: 'source-1',
        documentVersionId: 'version-1',
        name: 'First',
        reviewStatus: 'approved',
        fields: [],
        preview: { previewId: 'preview-1', state: 'ready', pages: [], pageCount: 1 },
      },
      {
        documentId: 'source-2',
        documentVersionId: 'version-2',
        name: 'Second',
        reviewStatus: 'approved',
        fields: [
          {
            fieldId: 'field-2',
            signatoryId: 'signatory-1',
            previewId: 'preview-2',
            type: 'signature',
            page: 1,
            positionX: 10,
            positionY: 20,
            width: 100,
            height: 40,
          },
        ],
        preview: { previewId: 'preview-2', state: 'ready', pages: [], pageCount: 2 },
      },
    ],
    readiness: { ready: true, assignmentCount: 2, issues: [] },
  } as FormalizationSignatureConfiguration)
  snapshotsRepository.findById.mockResolvedValue({
    id: 'snapshot-1',
    formalizationId: 'formalization-1',
    formalizationVersion: 8,
    signatureConfigurationVersion: 3,
    snapshotHash: 'snapshot-hash',
    createdBy: 'actor-1',
    createdAt: new Date(),
  })
  providerResourcesRepository.findByRequestId.mockResolvedValue(null)
  contentReader.readContent.mockImplementation(
    async (fileId) => new Uint8Array(fileId === 'file-1' ? [1] : [2]),
  )
  sourceReader.findDocumentVersion.mockImplementation(
    async (_formalizationId, versionId) => ({
      documentId: versionId === 'version-1' ? 'source-1' : 'source-2',
      documentVersionId: versionId,
      documentSpecificationId: 'specification-id',
      name: versionId === 'version-1' ? 'First' : 'Second',
      reviewStatus: 'approved',
      fileId: versionId,
    }),
  )
  provider.findEnvelopeByExternalId.mockResolvedValue(null)
  provider.getContractVersion.mockReturnValue('2.17.0')
  provider.createEnvelope.mockResolvedValue({
    providerEnvelopeId: 'envelope-1',
    documents: [
      { externalId: 'request-document-1', providerEnvelopeItemId: 'item-1' },
      { externalId: 'request-document-2', providerEnvelopeItemId: 'item-2' },
    ],
    recipients: [
      {
        externalId: 'recipient-1',
        providerRecipientId: 'provider-recipient-1',
        rawSigningCredential: 'raw-credential',
      },
    ],
  })
  cipher.encrypt.mockResolvedValue({ ciphertext: 'encrypted', keyId: 'key-1' })
  hasher.hash.mockImplementation((value) => `${value}-hash`)
  let id = 0
  idProvider.generate.mockImplementation(() => `id-${++id}`)
  datetimeProvider.now.mockReturnValue(new Date('2026-09-03T00:00:00.000Z'))
  transaction.completeProvisioning.mockResolvedValue('applied')
  broker.publish.mockResolvedValue()
  const dependencies = {
    attemptsRepository,
    requestsRepository,
    documentsRepository,
    recipientsRepository,
    recipientDocumentsRepository,
    configurationRepository,
    snapshotsRepository,
    metadataReader,
    sourceReader,
    contentReader,
    providerResourcesRepository,
    providerDocumentResourcesRepository,
    providerRecipientResourcesRepository,
    invitationsRepository,
    invitationSendAttemptsRepository,
    transaction,
    provider,
    cipher,
    hasher,
    idProvider,
    secretGenerator,
    datetimeProvider,
    broker,
  }
  return { dependencies, request, attempt }
}

function createUseCase(
  dependencies: ReturnType<typeof makeDependencies>['dependencies'],
) {
  return new ProvisionFormalizationSignatureRequestUseCase(dependencies)
}

describe('ProvisionFormalizationSignatureRequestUseCase', () => {
  it('creates one ordered multi-document envelope and one invitation per recipient', async () => {
    const { dependencies } = makeDependencies()
    const result = await createUseCase(dependencies).execute({
      requestId: 'request-1',
      attemptToken: 'attempt-token',
      occurredAt: new Date('2026-09-03T00:00:00.000Z'),
    })
    expect(result.outcome).toBe('provisioned')
    expect(dependencies.provider.createEnvelope).toHaveBeenCalledWith(
      expect.objectContaining({
        distribution: 'none',
        documents: [
          expect.objectContaining({ externalId: 'request-document-1' }),
          expect.objectContaining({ externalId: 'request-document-2' }),
        ],
        recipients: [
          expect.objectContaining({
            externalId: 'recipient-1',
            email: expect.stringContaining('signing.invalid'),
            fields: [
              expect.objectContaining({ documentExternalId: 'request-document-2' }),
            ],
          }),
        ],
      }),
    )
    expect(dependencies.provider.distributeEnvelope).toHaveBeenCalledWith({
      providerEnvelopeId: 'envelope-1',
      distribution: 'none',
    })
    expect(dependencies.cipher.encrypt).toHaveBeenCalledWith(
      expect.objectContaining({
        purpose: 'provider_credential',
        plaintext: expect.any(Uint8Array),
      }),
    )
    expect(dependencies.transaction.completeProvisioning).toHaveBeenCalledWith(
      expect.objectContaining({
        expectedFormalizationVersion: 9,
        providerDocumentResources: [
          expect.objectContaining({
            requestDocumentId: 'request-document-1',
            providerEnvelopeItemId: 'item-1',
          }),
          expect.objectContaining({
            requestDocumentId: 'request-document-2',
            providerEnvelopeItemId: 'item-2',
          }),
        ],
        invitations: [expect.objectContaining({ recipientId: 'recipient-1' })],
      }),
    )
  })

  it('uses the immutable request snapshot when editable configuration advances later', async () => {
    const { dependencies } = makeDependencies()
    const configuration =
      await dependencies.configurationRepository.findByFormalizationId('formalization-1')
    if (!configuration) throw new Error('missing fixture configuration')
    dependencies.configurationRepository.findByFormalizationId.mockResolvedValue({
      ...configuration,
      version: 99,
    })

    await expect(
      createUseCase(dependencies).execute({
        requestId: 'request-1',
        attemptToken: 'attempt-token',
        occurredAt: new Date('2026-09-03T00:00:00.000Z'),
      }),
    ).resolves.toMatchObject({ outcome: 'provisioned' })
    expect(dependencies.provider.createEnvelope).toHaveBeenCalledTimes(1)
  })

  it('recovers a timeout after provider creation through external-id reconciliation', async () => {
    const { dependencies } = makeDependencies()
    dependencies.provider.findEnvelopeByExternalId.mockResolvedValue({
      providerEnvelopeId: 'recovered-envelope',
      documents: [
        { externalId: 'request-document-1', providerEnvelopeItemId: 'item-1' },
        { externalId: 'request-document-2', providerEnvelopeItemId: 'item-2' },
      ],
      recipients: [
        {
          externalId: 'recipient-1',
          providerRecipientId: 'provider-recipient-1',
          rawSigningCredential: 'raw-credential',
        },
      ],
    })
    await expect(
      createUseCase(dependencies).execute({
        requestId: 'request-1',
        attemptToken: 'attempt-token',
        occurredAt: new Date(),
      }),
    ).resolves.toMatchObject({ outcome: 'reconciled' })
    expect(dependencies.provider.createEnvelope).not.toHaveBeenCalled()
  })

  it.each([
    [
      'duplicate item',
      [
        { externalId: 'request-document-1', providerEnvelopeItemId: 'item-1' },
        { externalId: 'request-document-1', providerEnvelopeItemId: 'item-1' },
      ],
    ],
    [
      'incomplete item',
      [{ externalId: 'request-document-1', providerEnvelopeItemId: 'item-1' }],
    ],
    [
      'foreign item',
      [
        { externalId: 'request-document-1', providerEnvelopeItemId: 'item-1' },
        { externalId: 'foreign-document', providerEnvelopeItemId: 'item-2' },
      ],
    ],
  ])('rejects %s provider document mappings', async (_label, documents) => {
    const { dependencies } = makeDependencies()
    dependencies.provider.createEnvelope.mockResolvedValue({
      providerEnvelopeId: 'envelope-1',
      documents,
      recipients: [
        {
          externalId: 'recipient-1',
          providerRecipientId: 'provider-recipient-1',
          rawSigningCredential: 'raw-credential',
        },
      ],
    })
    await expect(
      createUseCase(dependencies).execute({
        requestId: 'request-1',
        attemptToken: 'attempt-token',
        occurredAt: new Date(),
      }),
    ).rejects.toThrow()
    expect(dependencies.transaction.completeProvisioning).not.toHaveBeenCalled()
  })

  it('rejects duplicate, incomplete and foreign provider recipient mappings', async () => {
    for (const recipients of [
      [
        {
          externalId: 'recipient-1',
          providerRecipientId: 'provider-1',
          rawSigningCredential: 'raw',
        },
        {
          externalId: 'recipient-1',
          providerRecipientId: 'provider-2',
          rawSigningCredential: 'raw',
        },
      ],
      [],
      [
        {
          externalId: 'foreign-recipient',
          providerRecipientId: 'provider-1',
          rawSigningCredential: 'raw',
        },
      ],
    ]) {
      const { dependencies } = makeDependencies()
      dependencies.provider.createEnvelope.mockResolvedValue({
        providerEnvelopeId: 'envelope-1',
        documents: [
          { externalId: 'request-document-1', providerEnvelopeItemId: 'item-1' },
          { externalId: 'request-document-2', providerEnvelopeItemId: 'item-2' },
        ],
        recipients,
      })
      await expect(
        createUseCase(dependencies).execute({
          requestId: 'request-1',
          attemptToken: 'attempt-token',
          occurredAt: new Date(),
        }),
      ).rejects.toThrow()
    }
  })

  it('rejects stale attempt tokens before provider calls', async () => {
    const { dependencies } = makeDependencies()
    dependencies.attemptsRepository.findByRequestId.mockResolvedValue(null)
    await expect(
      createUseCase(dependencies).execute({
        requestId: 'request-1',
        attemptToken: 'stale-token',
        occurredAt: new Date(),
      }),
    ).resolves.toEqual({ outcome: 'retry_required', invitationIds: [] })
    expect(dependencies.provider.createEnvelope).not.toHaveBeenCalled()
  })
})
