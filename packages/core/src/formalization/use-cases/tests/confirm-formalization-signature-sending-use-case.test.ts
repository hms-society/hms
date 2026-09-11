import { describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import { ConfirmFormalizationSignatureSendingUseCase } from '../confirm-formalization-signature-sending-use-case'
import { fakeFormalization } from '../../domain/entities/fakers'
import type { FormalizationSignatureConfiguration } from '../../domain/structures'
import type {
  FormalizationSignatureConfigurationRepository,
  FormalizationSignatureDocumentMetadataReader,
  FormalizationSignatureGatewayTransaction,
  FormalizationSignatureRequestsRepository,
  FormalizationSignatureSnapshotsRepository,
  FormalizationSignatureSourceReader,
  FormalizationsRepository,
  SignatureSecretHasher,
} from '../../interfaces'
import type { Broker, DatetimeProvider, IdProvider } from '../../../shared/interfaces'

const NOW = new Date('2026-01-01T12:00:00.000Z')

type Dependencies = {
  formalizationsRepository: MockProxy<FormalizationsRepository>
  configurationRepository: MockProxy<FormalizationSignatureConfigurationRepository>
  sourceReader: MockProxy<FormalizationSignatureSourceReader>
  requestsRepository: MockProxy<FormalizationSignatureRequestsRepository>
  snapshotsRepository: MockProxy<FormalizationSignatureSnapshotsRepository>
  transaction: MockProxy<FormalizationSignatureGatewayTransaction>
  idProvider: MockProxy<IdProvider>
  datetimeProvider: MockProxy<DatetimeProvider>
  broker: MockProxy<Broker>
  hasher: MockProxy<SignatureSecretHasher>
  metadataReader: MockProxy<FormalizationSignatureDocumentMetadataReader>
}

function makeDependencies(): Dependencies {
  const dependencies = {
    formalizationsRepository: mock<FormalizationsRepository>(),
    configurationRepository: mock<FormalizationSignatureConfigurationRepository>(),
    sourceReader: mock<FormalizationSignatureSourceReader>(),
    requestsRepository: mock<FormalizationSignatureRequestsRepository>(),
    snapshotsRepository: mock<FormalizationSignatureSnapshotsRepository>(),
    transaction: mock<FormalizationSignatureGatewayTransaction>(),
    idProvider: mock<IdProvider>(),
    datetimeProvider: mock<DatetimeProvider>(),
    broker: mock<Broker>(),
    hasher: mock<SignatureSecretHasher>(),
    metadataReader: mock<FormalizationSignatureDocumentMetadataReader>(),
  }
  const formalization = fakeFormalization({
    id: 'formalization-1',
    assignedLawyerId: 'lawyer-1',
    version: 7,
  })
  dependencies.formalizationsRepository.findById.mockResolvedValue(formalization)
  dependencies.requestsRepository.findByConfirmationKeyHash.mockResolvedValue(null)
  dependencies.configurationRepository.findByFormalizationId.mockResolvedValue(
    makeConfiguration(),
  )
  dependencies.sourceReader.listCurrentDocuments.mockResolvedValue([
    {
      documentId: 'document-1',
      documentVersionId: 'version-1',
      documentSpecificationId: 'specification-1',
      name: 'Contract',
      reviewStatus: 'approved',
      fileId: 'file-1',
    },
  ])
  dependencies.metadataReader.findMetadata.mockResolvedValue({
    privateFileId: 'private-file-1',
    sha256: 'a'.repeat(64),
    byteCount: 100,
  })
  dependencies.datetimeProvider.now.mockReturnValue(NOW)
  dependencies.hasher.hash.mockImplementation((value) => `${value}-hash`)
  let id = 0
  dependencies.idProvider.generate.mockImplementation(() => `id-${++id}`)
  dependencies.transaction.confirmSending.mockResolvedValue('applied')
  dependencies.broker.publish.mockResolvedValue()
  return dependencies
}

function makeConfiguration(
  overrides: Partial<FormalizationSignatureConfiguration> = {},
): FormalizationSignatureConfiguration {
  return {
    formalizationId: 'formalization-1',
    version: 3,
    editable: true,
    status: 'ready_for_sending',
    previewPreparation: { total: 1, pending: 0, processing: 0, ready: 1, failed: 0 },
    signatories: [
      {
        signatoryId: 'signatory-1',
        personId: 'person-1',
        role: 'client',
        name: 'Client',
        removable: false,
        availableChannels: [],
        selectedChannels: [],
        documentIds: ['document-1'],
      },
    ],
    documents: [
      {
        documentId: 'document-1',
        documentVersionId: 'version-1',
        name: 'Contract',
        reviewStatus: 'approved',
        preview: { previewId: 'preview-1', state: 'ready', pages: [], pageCount: 1 },
        fields: [],
      },
    ],
    readiness: { ready: true, assignmentCount: 1, issues: [] },
    ...overrides,
  }
}

function request(overrides: Record<string, unknown> = {}) {
  return {
    formalizationId: 'formalization-1',
    actorId: 'lawyer-1',
    expectedVersion: 7,
    confirmationKey: 'confirmation-key',
    ...overrides,
  }
}

describe('Confirm Formalization Signature Sending Use Case', () => {
  it('creates one immutable graph and atomically projects provisioning state', async () => {
    const dependencies = makeDependencies()
    const result = await new ConfirmFormalizationSignatureSendingUseCase(
      dependencies,
    ).execute(request())
    const transactionInput = dependencies.transaction.confirmSending.mock.calls[0][0]

    expect(result).toMatchObject({ status: 'provisioning', duplicate: false })
    expect(transactionInput.documents).toHaveLength(1)
    expect(transactionInput.recipients).toHaveLength(1)
    expect(transactionInput.provisioningAttempt).toBeDefined()
    expect(transactionInput.snapshot).toMatchObject({
      formalizationVersion: 7,
      signatureConfigurationVersion: 3,
      createdAt: NOW,
    })
    expect(transactionInput.formalizationChanges).toEqual({
      signatureRequestId: transactionInput.request.id,
      signatureStatus: 'provisioning',
    })
    expect(dependencies.broker.publish).toHaveBeenCalledTimes(1)
    expect(dependencies.broker.publish.mock.calls[0][0]).toMatchObject({
      payload: expect.objectContaining({
        version: 1,
        requestId: transactionInput.request.id,
      }),
    })
    expect(dependencies.metadataReader.findMetadata).toHaveBeenCalledWith({
      formalizationId: 'formalization-1',
      previewId: 'preview-1',
    })
  })

  it('returns the existing request for an idempotent confirmation without rebuilding or publishing', async () => {
    const dependencies = makeDependencies()
    dependencies.requestsRepository.findByConfirmationKeyHash.mockResolvedValue({
      id: 'existing-request',
      formalizationId: 'formalization-1',
      signatureConfigurationVersion: 3,
      snapshotId: 'snapshot',
      confirmationKeyHash: 'confirmation-key-hash',
      status: 'sending',
      version: 2,
      createdBy: 'lawyer-1',
      createdAt: NOW,
      updatedAt: NOW,
    })

    const result = await new ConfirmFormalizationSignatureSendingUseCase(
      dependencies,
    ).execute(request())

    expect(result).toEqual({
      requestId: 'existing-request',
      status: 'sending',
      duplicate: true,
    })
    expect(
      dependencies.configurationRepository.findByFormalizationId,
    ).not.toHaveBeenCalled()
    expect(dependencies.transaction.confirmSending).not.toHaveBeenCalled()
    expect(dependencies.broker.publish).not.toHaveBeenCalled()
  })

  it('allows an administrator to confirm a lawyer-owned Formalization', async () => {
    const dependencies = makeDependencies()

    await expect(
      new ConfirmFormalizationSignatureSendingUseCase(dependencies).execute(
        request({ actorId: 'admin-1', actorProfile: 'admin' }),
      ),
    ).resolves.toMatchObject({ status: 'provisioning', duplicate: false })
  })

  it.each([
    [
      {
        status: 'configuring',
        readiness: {
          ready: false,
          assignmentCount: 0,
          issues: [{ path: 'documents', code: 'preparation_pending' }],
        },
      },
      'not ready',
    ],
    [
      {
        status: 'ready_for_sending',
        readiness: {
          ready: false,
          assignmentCount: 1,
          issues: [{ path: 'documents', code: 'preparation_pending' }],
        },
      },
      'readiness invalid',
    ],
  ] as const)('fails closed when confirmation is %s', (configuration, _label) => {
    const dependencies = makeDependencies()
    dependencies.configurationRepository.findByFormalizationId.mockResolvedValue(
      makeConfiguration(configuration),
    )

    return expect(
      new ConfirmFormalizationSignatureSendingUseCase(dependencies).execute(request()),
    ).rejects.toThrow()
  })

  it('does not publish a provisioning event when the versioned transaction loses a concurrent confirmation race', async () => {
    const dependencies = makeDependencies()
    dependencies.transaction.confirmSending.mockResolvedValue('conflict')

    await expect(
      new ConfirmFormalizationSignatureSendingUseCase(dependencies).execute(request()),
    ).rejects.toThrow()

    expect(dependencies.transaction.confirmSending).toHaveBeenCalledWith(
      expect.objectContaining({
        expectedFormalizationVersion: 7,
        expectedSignatureConfigurationVersion: 3,
      }),
    )
    expect(dependencies.broker.publish).not.toHaveBeenCalled()
  })
})
