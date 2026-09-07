import { describe, expect, it, vi } from 'vitest'
import { mock } from 'vitest-mock-extended'
import { ReconcileSignatureRequestUseCase } from '../reconcile-signature-request-use-case'
import {
  fakeFormalizationSignatureProviderResource,
  fakeFormalizationSignatureRequest,
} from '../../domain/entities/fakers'
import type {
  FormalizationSignatureArtifactsRepository,
  FormalizationSignatureGatewayTransaction,
  FormalizationSignatureProviderDocumentResourcesRepository,
  FormalizationSignatureProviderRecipientResourcesRepository,
  FormalizationSignatureProviderResourcesRepository,
  FormalizationSignatureRecipientDocumentsRepository,
  FormalizationSignatureRecipientsRepository,
  FormalizationSignatureRequestDocumentsRepository,
  FormalizationSignatureRequestsRepository,
  FormalizationSignatureSnapshotsRepository,
  FormalizationSignatureProtocolsRepository,
  FormalizationsRepository,
  SignatureProvider,
} from '../../interfaces'
import type { FormalizationSignatureProviderObservation } from '../../domain/structures'
import type { FileStorageProvider, IdProvider } from '../../../shared/interfaces'

const NOW = new Date('2026-09-03T00:00:00.000Z')

function pdfBytes(index: number): Uint8Array {
  return new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, index + 1, index + 2])
}

function makeFixture() {
  const requests = mock<FormalizationSignatureRequestsRepository>()
  const resources = mock<FormalizationSignatureProviderResourcesRepository>()
  const recipientResources =
    mock<FormalizationSignatureProviderRecipientResourcesRepository>()
  const documentResources =
    mock<FormalizationSignatureProviderDocumentResourcesRepository>()
  const assignments = mock<FormalizationSignatureRecipientDocumentsRepository>()
  const documents = mock<FormalizationSignatureRequestDocumentsRepository>()
  const recipients = mock<FormalizationSignatureRecipientsRepository>()
  const protocols = mock<FormalizationSignatureProtocolsRepository>()
  const artifacts = mock<FormalizationSignatureArtifactsRepository>()
  const snapshots = mock<FormalizationSignatureSnapshotsRepository>()
  const formalizations = mock<FormalizationsRepository>()
  const transaction = mock<FormalizationSignatureGatewayTransaction>()
  const storage = mock<FileStorageProvider>()
  const idProvider = mock<IdProvider>()
  const provider = mock<SignatureProvider>()
  const request = fakeFormalizationSignatureRequest({
    id: 'request-1',
    formalizationId: 'formalization-1',
    snapshotId: 'snapshot-1',
    signatureConfigurationVersion: 3,
    version: 4,
    status: 'in_progress',
  })
  const resource = fakeFormalizationSignatureProviderResource({
    id: 'provider-resource-1',
    requestId: request.id,
    providerEnvelopeId: 'envelope-1',
  })
  const docs = [1, 2].map((position) => ({
    id: `document-${position}`,
    requestId: request.id,
    sourceDocumentId: `source-${position}`,
    sourceDocumentVersionId: `version-${position}`,
    signaturePreviewId: `preview-${position}`,
    unsignedPrivateFileId: `file-${position}`,
    unsignedSha256: `unsigned-sha-${position}`,
    byteCount: 1,
    pageCount: 1,
    position: position - 1,
    status: 'sent' as const,
    version: 1,
    createdAt: NOW,
    updatedAt: NOW,
  }))
  const packageRecipients = [1, 2].map((position) => ({
    id: `recipient-${position}`,
    requestId: request.id,
    signatoryId: `signatory-${position}`,
    personId: `person-${position}`,
    actorKind: 'client' as const,
    displayNameSnapshot: `Recipient ${position}`,
    deliveryChannel: 'email' as const,
    status: 'signing' as const,
    version: 1,
    createdAt: NOW,
    updatedAt: NOW,
  }))
  const itemResources = docs.map((document, index) => ({
    id: `item-resource-${index + 1}`,
    requestId: request.id,
    providerResourceId: resource.id,
    requestDocumentId: document.id,
    providerEnvelopeItemId: `item-${index + 1}`,
    createdAt: NOW,
  }))
  const packageAssignments = packageRecipients.flatMap((recipient) =>
    docs.map((document, index) => ({
      id: `assignment-${recipient.id}-${index + 1}`,
      requestId: request.id,
      recipientId: recipient.id,
      requestDocumentId: document.id,
      createdAt: NOW,
    })),
  )
  const observation: FormalizationSignatureProviderObservation = {
    providerEnvelopeId: resource.providerEnvelopeId,
    envelopeStatus: 'in_progress' as const,
    recipients: packageRecipients.map((_recipient, recipientIndex) => ({
      providerRecipientId: `provider-recipient-${recipientIndex + 1}`,
      recipientStatus: 'submitted' as const,
      items: itemResources.map((item) => ({
        providerEnvelopeItemId: item.providerEnvelopeItemId,
        assignment: 'required' as const,
        status: 'completed' as const,
        requiredFieldCount: 1,
        completedFieldCount: 1,
      })),
    })),
    occurredAt: NOW,
    receivedAt: NOW,
  }
  requests.findById
    .mockResolvedValueOnce(request)
    .mockResolvedValue({ ...request, status: 'submitted' })
  resources.findByRequestId.mockResolvedValue(resource)
  recipientResources.listByProviderResourceId.mockResolvedValue(
    packageRecipients.map((recipient, index) => ({
      id: `recipient-resource-${index + 1}`,
      requestId: request.id,
      providerResourceId: resource.id,
      recipientId: recipient.id,
      providerRecipientId: `provider-recipient-${index + 1}`,
      encryptedSigningCredential: `credential-${index + 1}`,
      cipherKeyId: `key-${index + 1}`,
      createdAt: NOW,
    })),
  )
  documentResources.listByProviderResourceId.mockResolvedValue(itemResources)
  assignments.listByRequestId.mockResolvedValue(packageAssignments)
  documents.listByRequestId
    .mockResolvedValueOnce(docs)
    .mockResolvedValue(
      docs.map((document) => ({ ...document, status: 'submitted' as const })),
    )
  recipients.listByRequestId.mockResolvedValueOnce(packageRecipients).mockResolvedValue(
    packageRecipients.map((recipient) => ({
      ...recipient,
      status: 'submitted' as const,
    })),
  )
  snapshots.findById.mockResolvedValue({
    id: 'snapshot-1',
    formalizationId: request.formalizationId,
    formalizationVersion: 8,
    signatureConfigurationVersion: 3,
    snapshotHash: 'snapshot-hash',
    createdBy: 'actor-1',
    createdAt: NOW,
  })
  formalizations.findById.mockResolvedValue({
    id: 'formalization-1',
    version: 8,
  } as Awaited<ReturnType<FormalizationsRepository['findById']>>)
  provider.findEnvelopeState.mockResolvedValue(observation)
  transaction.recordProviderObservationAndDerive.mockResolvedValue('applied')
  transaction.confirmEnvelopeAndDerive.mockResolvedValue('applied')
  protocols.findByRecipientAndRequest.mockResolvedValue(null)
  artifacts.findByRequestId.mockResolvedValue([])
  let id = 0
  idProvider.generate.mockImplementation(() => `generated-${++id}`)
  storage.save.mockImplementation(async (input) => ({
    id: `stored-${input.fileName}`,
    filePath: input.filePath,
    fileName: input.fileName,
    contentType: input.contentType,
    sizeInBytes: input.sizeInBytes,
    createdAt: NOW,
  }))
  provider.downloadCompletedArtifacts.mockResolvedValue(
    itemResources.map((item, index) => ({
      kind: 'signed_pdf' as const,
      requestDocumentId: item.requestDocumentId,
      bytes: pdfBytes(index),
      mediaType: 'application/pdf',
    })),
  )
  return {
    requests,
    resources,
    recipientResources,
    documentResources,
    assignments,
    documents,
    recipients,
    protocols,
    artifacts,
    snapshots,
    formalizations,
    transaction,
    storage,
    idProvider,
    provider,
    request,
    resource,
    docs,
    packageRecipients,
    itemResources,
    observation,
  }
}

function useCase(fixture: ReturnType<typeof makeFixture>) {
  return new ReconcileSignatureRequestUseCase({
    requestsRepository: fixture.requests,
    resourcesRepository: fixture.resources,
    recipientResourcesRepository: fixture.recipientResources,
    documentResourcesRepository: fixture.documentResources,
    documentsRepository: fixture.documents,
    recipientsRepository: fixture.recipients,
    assignmentsRepository: fixture.assignments,
    protocolsRepository: fixture.protocols,
    artifactsRepository: fixture.artifacts,
    snapshotsRepository: fixture.snapshots,
    formalizationsRepository: fixture.formalizations,
    transaction: fixture.transaction,
    fileStorageProvider: fixture.storage,
    idProvider: fixture.idProvider,
    provider: fixture.provider,
  })
}

describe('ReconcileSignatureRequestUseCase', () => {
  it('returns unchanged for incomplete provider items after one authoritative batch transaction', async () => {
    const fixture = makeFixture()
    fixture.observation.recipients[0].items[0].status = 'pending'
    fixture.provider.findEnvelopeState.mockResolvedValue(fixture.observation)
    await expect(
      useCase(fixture).execute({
        requestId: 'request-1',
        reason: 'scheduled',
        occurredAt: NOW,
      }),
    ).resolves.toEqual({ outcome: 'unchanged' })
    expect(fixture.provider.findEnvelopeState).toHaveBeenCalledTimes(1)
    expect(fixture.transaction.recordProviderObservationAndDerive).toHaveBeenCalledTimes(
      1,
    )
    expect(fixture.transaction.recordProviderObservationAndDerive).toHaveBeenCalledWith(
      expect.objectContaining({ envelopeStatus: 'in_progress', receiptUpdates: [] }),
    )
    expect(fixture.transaction.confirmEnvelopeAndDerive).not.toHaveBeenCalled()
  })

  it('accepts shared item IDs for two recipients and records submitted state once', async () => {
    const fixture = makeFixture()
    await expect(
      useCase(fixture).execute({
        requestId: 'request-1',
        reason: 'scheduled',
        occurredAt: NOW,
      }),
    ).resolves.toEqual({ outcome: 'submitted' })
    expect(fixture.provider.findEnvelopeState).toHaveBeenCalledTimes(1)
    expect(fixture.transaction.recordProviderObservationAndDerive).toHaveBeenCalledTimes(
      1,
    )
    const input = fixture.transaction.recordProviderObservationAndDerive.mock.calls[0][0]
    expect(input.receiptUpdates).toEqual([])
    expect(input.recipientObservations).toHaveLength(2)
    expect(
      input.recipientObservations[0]?.recipientDocumentObservations.map(
        (item) => item.providerEnvelopeItemId,
      ),
    ).toEqual(['item-1', 'item-2'])
    expect(
      input.recipientObservations[1]?.recipientDocumentObservations.map(
        (item) => item.providerEnvelopeItemId,
      ),
    ).toEqual(['item-1', 'item-2'])
    expect(fixture.transaction.confirmEnvelopeAndDerive).not.toHaveBeenCalled()
  })

  it('does not derive submitted from a provider recipient status without its required items', async () => {
    const fixture = makeFixture()
    Object.assign(fixture.observation.recipients[1], {
      recipientStatus: 'submitted',
      items: fixture.observation.recipients[1].items.map((item, index) =>
        index === 1 ? { ...item, status: 'pending' as const } : item,
      ),
    })

    await expect(
      useCase(fixture).execute({
        requestId: 'request-1',
        reason: 'scheduled',
        occurredAt: NOW,
      }),
    ).resolves.toEqual({ outcome: 'unchanged' })
    const input =
      fixture.transaction.recordProviderObservationAndDerive.mock.calls[0]?.[0]
    expect(input?.recipientObservations[1]?.recipientChanges.status).toBe('signing')
    expect(input?.observationScope).toBe('authoritative_envelope')
    expect(input).not.toHaveProperty('requestChanges')
    expect(input).not.toHaveProperty('formalizationChanges')
  })

  it('does not regress an authenticated recipient from an unsigned provider observation', async () => {
    const fixture = makeFixture()
    fixture.observation.recipients = fixture.observation.recipients.map((recipient) => ({
      ...recipient,
      recipientStatus: 'invited',
      items: recipient.items.map((item) => ({ ...item, status: 'pending' })),
    }))
    fixture.provider.findEnvelopeState.mockResolvedValue(fixture.observation)
    fixture.recipients.listByRequestId.mockReset()
    fixture.recipients.listByRequestId.mockResolvedValue(
      fixture.packageRecipients.map((recipient, index) => ({
        ...recipient,
        status: index === 0 ? ('authenticated' as const) : ('invited' as const),
      })),
    )

    await expect(
      useCase(fixture).execute({
        requestId: 'request-1',
        reason: 'scheduled',
        occurredAt: NOW,
      }),
    ).resolves.toEqual({ outcome: 'unchanged' })
    const input =
      fixture.transaction.recordProviderObservationAndDerive.mock.calls[0]?.[0]
    expect(
      input?.recipientObservations.map((item) => item.recipientChanges.status),
    ).toEqual(['authenticated', 'invited'])
  })

  it('applies envelope terminal state only to non-completed documents', async () => {
    const fixture = makeFixture()
    fixture.observation.envelopeStatus = 'rejected'
    fixture.observation.recipients = fixture.observation.recipients.map((recipient) => ({
      ...recipient,
      items: recipient.items.map((item, index) =>
        index === 1 ? { ...item, status: 'pending' as const } : item,
      ),
    }))
    fixture.provider.findEnvelopeState.mockResolvedValue(fixture.observation)
    await expect(
      useCase(fixture).execute({
        requestId: 'request-1',
        reason: 'webhook',
        occurredAt: NOW,
      }),
    ).resolves.toEqual({ outcome: 'terminal' })
    expect(fixture.transaction.recordProviderObservationAndDerive).toHaveBeenCalledTimes(
      1,
    )
    expect(fixture.transaction.recordProviderObservationAndDerive).toHaveBeenCalledWith(
      expect.objectContaining({
        observationScope: 'authoritative_envelope',
        requestDocumentChanges: [
          {
            requestDocumentId: 'document-1',
            expectedVersion: 1,
            changes: { status: 'submitted', submittedAt: NOW },
          },
          {
            requestDocumentId: 'document-2',
            expectedVersion: 1,
            changes: { status: 'rejected', terminalAt: NOW },
          },
        ],
        recipientObservations: expect.arrayContaining([
          expect.objectContaining({
            recipientChanges: expect.objectContaining({ status: 'rejected' }),
          }),
        ]),
      }),
    )
    expect(fixture.provider.downloadCompletedArtifacts).not.toHaveBeenCalled()
  })

  it.each([
    'rejected',
    'cancelled',
    'expired',
  ] as const)('maps mixed item %s state only to its request document', async (status) => {
    const fixture = makeFixture()
    fixture.observation.recipients[1].items[1].status = status
    fixture.observation.recipients[0].items[1].status = 'pending'
    fixture.provider.findEnvelopeState.mockResolvedValue(fixture.observation)
    await expect(
      useCase(fixture).execute({
        requestId: 'request-1',
        reason: 'scheduled',
        occurredAt: NOW,
      }),
    ).resolves.toEqual({ outcome: 'terminal' })
    expect(fixture.transaction.recordProviderObservationAndDerive).toHaveBeenCalledTimes(
      1,
    )
    expect(
      fixture.transaction.recordProviderObservationAndDerive.mock.calls[0]?.[0]
        .requestDocumentChanges,
    ).toEqual([
      {
        requestDocumentId: 'document-1',
        expectedVersion: 1,
        changes: { status: 'submitted', submittedAt: NOW },
      },
      {
        requestDocumentId: 'document-2',
        expectedVersion: 1,
        changes: { status, terminalAt: NOW },
      },
    ])
    expect(fixture.transaction.confirmEnvelopeAndDerive).not.toHaveBeenCalled()
  })

  it('confirms a completed shared envelope only after storing artifacts and through one DB confirmation', async () => {
    const fixture = makeFixture()
    fixture.observation.envelopeStatus = 'completed'
    fixture.provider.findEnvelopeState.mockResolvedValue(fixture.observation)
    await expect(
      useCase(fixture).execute({
        requestId: 'request-1',
        reason: 'scheduled',
        occurredAt: NOW,
      }),
    ).resolves.toEqual({ outcome: 'confirmed' })
    expect(fixture.provider.findEnvelopeState).toHaveBeenCalledTimes(1)
    expect(fixture.transaction.recordProviderObservationAndDerive).toHaveBeenCalledTimes(
      1,
    )
    expect(fixture.transaction.confirmEnvelopeAndDerive).toHaveBeenCalledTimes(1)
    expect(fixture.transaction.confirmEnvelopeAndDerive).toHaveBeenCalledWith(
      expect.objectContaining({
        artifactsToAdd: expect.arrayContaining([
          expect.objectContaining({
            requestDocumentId: 'document-1',
            sha256: 'cf749c019d0245509084eb77bfe3a6018d074e8bd707663e78b42a4a6de30b1b',
          }),
        ]),
        protocols: expect.arrayContaining([
          expect.objectContaining({ recipientId: 'recipient-1' }),
          expect.objectContaining({ recipientId: 'recipient-2' }),
        ]),
      }),
    )
    expect(fixture.artifacts.add).not.toHaveBeenCalled()
    expect(fixture.protocols.add).not.toHaveBeenCalled()
    expect(fixture.storage.save).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        filePath: 'formalization/signatures/request-1/document-1.pdf',
        fileName: 'document-1.pdf',
      }),
    )
    expect(fixture.storage.save).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        filePath: 'formalization/signatures/request-1/document-2.pdf',
        fileName: 'document-2.pdf',
      }),
    )
    expect(fixture.storage.save.mock.invocationCallOrder[0]).toBeLessThan(
      fixture.transaction.confirmEnvelopeAndDerive.mock.invocationCallOrder[0],
    )
  })

  it('reloads versions after observation before confirming the package', async () => {
    const fixture = makeFixture()
    fixture.observation.envelopeStatus = 'completed'
    fixture.requests.findById.mockReset()
    fixture.requests.findById
      .mockResolvedValueOnce(fixture.request)
      .mockResolvedValueOnce({ ...fixture.request, version: 5, status: 'submitted' })
    fixture.recipients.listByRequestId.mockReset()
    fixture.recipients.listByRequestId.mockResolvedValueOnce(
      fixture.observation.recipients.map((_, index) => ({
        id: `recipient-${index + 1}`,
        requestId: 'request-1',
        signatoryId: `signatory-${index + 1}`,
        personId: `person-${index + 1}`,
        actorKind: 'client' as const,
        displayNameSnapshot: `Recipient ${index + 1}`,
        deliveryChannel: 'email' as const,
        status: 'signing' as const,
        version: 1,
        createdAt: NOW,
        updatedAt: NOW,
      })),
    )
    fixture.recipients.listByRequestId.mockResolvedValueOnce(
      fixture.observation.recipients.map((_, index) => ({
        id: `recipient-${index + 1}`,
        requestId: 'request-1',
        signatoryId: `signatory-${index + 1}`,
        personId: `person-${index + 1}`,
        actorKind: 'client' as const,
        displayNameSnapshot: `Recipient ${index + 1}`,
        deliveryChannel: 'email' as const,
        status: 'submitted' as const,
        version: 2,
        createdAt: NOW,
        updatedAt: NOW,
      })),
    )
    fixture.formalizations.findById.mockReset()
    fixture.formalizations.findById
      .mockResolvedValueOnce({ id: 'formalization-1', version: 8 } as never)
      .mockResolvedValueOnce({ id: 'formalization-1', version: 9 } as never)
    await expect(
      useCase(fixture).execute({
        requestId: 'request-1',
        reason: 'scheduled',
        occurredAt: NOW,
      }),
    ).resolves.toEqual({ outcome: 'confirmed' })
    expect(fixture.transaction.confirmEnvelopeAndDerive).toHaveBeenCalledWith(
      expect.objectContaining({
        expectedRequestVersion: 5,
        recipientChanges: expect.arrayContaining([
          expect.objectContaining({ expectedVersion: 2 }),
        ]),
      }),
    )
    const confirmation = fixture.transaction.confirmEnvelopeAndDerive.mock.calls[0]?.[0]
    expect(confirmation).not.toHaveProperty('expectedFormalizationVersion')
    expect(confirmation).not.toHaveProperty('derivedRequestChanges')
  })

  it('returns terminal when the authoritative reload is terminal', async () => {
    const fixture = makeFixture()
    fixture.observation.envelopeStatus = 'completed'
    fixture.requests.findById.mockReset()
    fixture.requests.findById
      .mockResolvedValueOnce(fixture.request)
      .mockResolvedValueOnce({ ...fixture.request, status: 'rejected' })
    await expect(
      useCase(fixture).execute({
        requestId: 'request-1',
        reason: 'scheduled',
        occurredAt: NOW,
      }),
    ).resolves.toEqual({ outcome: 'terminal' })
    expect(fixture.transaction.confirmEnvelopeAndDerive).not.toHaveBeenCalled()
  })

  it('does not confirm a completed provider envelope when the fresh graph is not submitted', async () => {
    const fixture = makeFixture()
    fixture.observation.envelopeStatus = 'completed'
    fixture.recipients.listByRequestId.mockReset()
    fixture.recipients.listByRequestId
      .mockResolvedValueOnce(
        fixture.observation.recipients.map((_, index) => ({
          id: `recipient-${index + 1}`,
          requestId: 'request-1',
          signatoryId: `signatory-${index + 1}`,
          personId: `person-${index + 1}`,
          actorKind: 'client' as const,
          displayNameSnapshot: `Recipient ${index + 1}`,
          deliveryChannel: 'email' as const,
          status: 'signing' as const,
          version: 1,
          createdAt: NOW,
          updatedAt: NOW,
        })),
      )
      .mockResolvedValueOnce(
        fixture.observation.recipients.map((_, index) => ({
          id: `recipient-${index + 1}`,
          requestId: 'request-1',
          signatoryId: `signatory-${index + 1}`,
          personId: `person-${index + 1}`,
          actorKind: 'client' as const,
          displayNameSnapshot: `Recipient ${index + 1}`,
          deliveryChannel: 'email' as const,
          status: 'signing' as const,
          version: 1,
          createdAt: NOW,
          updatedAt: NOW,
        })),
      )
    await expect(
      useCase(fixture).execute({
        requestId: 'request-1',
        reason: 'scheduled',
        occurredAt: NOW,
      }),
    ).resolves.toEqual({ outcome: 'submitted' })
    expect(fixture.transaction.confirmEnvelopeAndDerive).not.toHaveBeenCalled()
  })

  it.each([
    'extra',
    'missing',
    'foreign',
  ] as const)('fails closed when fresh recipient membership is %s', async (drift) => {
    const fixture = makeFixture()
    fixture.observation.envelopeStatus = 'completed'
    const freshRecipients = fixture.packageRecipients.map((recipient) => ({
      ...recipient,
      status: 'submitted' as const,
    }))
    if (drift === 'extra')
      freshRecipients.push({ ...freshRecipients[0], id: 'recipient-extra' })
    if (drift === 'missing') freshRecipients.pop()
    if (drift === 'foreign' && freshRecipients[0])
      freshRecipients[0] = { ...freshRecipients[0], requestId: 'request-2' }
    fixture.recipients.listByRequestId.mockReset()
    fixture.recipients.listByRequestId
      .mockResolvedValueOnce(fixture.packageRecipients)
      .mockResolvedValueOnce(freshRecipients)
    await expect(
      useCase(fixture).execute({
        requestId: 'request-1',
        reason: 'scheduled',
        occurredAt: NOW,
      }),
    ).resolves.toEqual({ outcome: 'submitted' })
    expect(fixture.transaction.confirmEnvelopeAndDerive).not.toHaveBeenCalled()
  })

  it.each([
    'extra',
    'missing',
    'foreign',
  ] as const)('fails closed when fresh document membership is %s', async (drift) => {
    const fixture = makeFixture()
    fixture.observation.envelopeStatus = 'completed'
    const freshDocuments = fixture.docs.map((document) => ({
      ...document,
      status: 'submitted' as const,
    }))
    if (drift === 'extra')
      freshDocuments.push({ ...freshDocuments[0], id: 'document-extra' })
    if (drift === 'missing') freshDocuments.pop()
    if (drift === 'foreign' && freshDocuments[0])
      freshDocuments[0] = { ...freshDocuments[0], requestId: 'request-2' }
    fixture.documents.listByRequestId.mockReset()
    fixture.documents.listByRequestId
      .mockResolvedValueOnce(fixture.docs)
      .mockResolvedValueOnce(freshDocuments)
    await expect(
      useCase(fixture).execute({
        requestId: 'request-1',
        reason: 'scheduled',
        occurredAt: NOW,
      }),
    ).resolves.toEqual({ outcome: 'submitted' })
    expect(fixture.transaction.confirmEnvelopeAndDerive).not.toHaveBeenCalled()
  })

  it.each([
    ['empty bytes', new Uint8Array(), 'application/pdf'],
    ['wrong media type', pdfBytes(0), 'application/octet-stream'],
    [
      'invalid PDF signature',
      new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x58]),
      'application/pdf',
    ],
  ] as const)('rejects signed PDF artifacts with %s before storage', async (_label, bytes, mediaType) => {
    const fixture = makeFixture()
    fixture.observation.envelopeStatus = 'completed'
    fixture.provider.downloadCompletedArtifacts.mockResolvedValue([
      {
        kind: 'signed_pdf',
        requestDocumentId: 'document-1',
        bytes,
        mediaType,
      },
    ])

    await expect(
      useCase(fixture).execute({
        requestId: 'request-1',
        reason: 'scheduled',
        occurredAt: NOW,
      }),
    ).resolves.toEqual({ outcome: 'retry_required' })
    expect(fixture.storage.save).not.toHaveBeenCalled()
    expect(fixture.transaction.confirmEnvelopeAndDerive).not.toHaveBeenCalled()
  })

  it.each([
    ['size', { byteCount: 999 }],
    ['hash', { sha256: '0'.repeat(64) }],
  ] as const)('rejects a signed PDF with a provider %s mismatch', async (_label, claim) => {
    const fixture = makeFixture()
    fixture.observation.envelopeStatus = 'completed'
    fixture.provider.downloadCompletedArtifacts.mockResolvedValue([
      {
        kind: 'signed_pdf',
        requestDocumentId: 'document-1',
        bytes: pdfBytes(0),
        mediaType: 'application/pdf',
        ...claim,
      },
    ])

    await expect(
      useCase(fixture).execute({
        requestId: 'request-1',
        reason: 'scheduled',
        occurredAt: NOW,
      }),
    ).resolves.toEqual({ outcome: 'retry_required' })
    expect(fixture.storage.save).not.toHaveBeenCalled()
    expect(fixture.transaction.confirmEnvelopeAndDerive).not.toHaveBeenCalled()
  })

  it.each([
    [
      'request',
      (fixture: ReturnType<typeof makeFixture>) =>
        fixture.requests.findById
          .mockReset()
          .mockResolvedValueOnce(fixture.request)
          .mockResolvedValueOnce({ ...fixture.request, status: 'rejected' }),
    ],
    [
      'recipient',
      (fixture: ReturnType<typeof makeFixture>) =>
        fixture.recipients.listByRequestId
          .mockReset()
          .mockResolvedValueOnce(fixture.packageRecipients)
          .mockResolvedValueOnce(
            fixture.packageRecipients.map((recipient, index) => ({
              ...recipient,
              status: index === 0 ? ('rejected' as const) : ('submitted' as const),
            })),
          ),
    ],
    [
      'document',
      (fixture: ReturnType<typeof makeFixture>) =>
        fixture.documents.listByRequestId
          .mockReset()
          .mockResolvedValueOnce(fixture.docs)
          .mockResolvedValueOnce(
            fixture.docs.map((document, index) => ({
              ...document,
              status: index === 0 ? ('rejected' as const) : ('submitted' as const),
            })),
          ),
    ],
  ] as const)('returns terminal for a terminal fresh %s projection', async (_owner, mutate) => {
    const fixture = makeFixture()
    fixture.observation.envelopeStatus = 'completed'
    mutate(fixture)
    await expect(
      useCase(fixture).execute({
        requestId: 'request-1',
        reason: 'scheduled',
        occurredAt: NOW,
      }),
    ).resolves.toEqual({ outcome: 'terminal' })
    expect(fixture.transaction.confirmEnvelopeAndDerive).not.toHaveBeenCalled()
  })

  it('does not download artifacts while an unrelated recipient is still pending', async () => {
    const fixture = makeFixture()
    fixture.observation.recipients[1].recipientStatus = 'authenticating'
    fixture.observation.envelopeStatus = 'in_progress'
    fixture.provider.findEnvelopeState.mockResolvedValue(fixture.observation)
    await expect(
      useCase(fixture).execute({
        requestId: 'request-1',
        reason: 'scheduled',
        occurredAt: NOW,
      }),
    ).resolves.toEqual({ outcome: 'submitted' })
    expect(fixture.provider.downloadCompletedArtifacts).not.toHaveBeenCalled()
    expect(fixture.transaction.recordProviderObservationAndDerive).toHaveBeenCalledTimes(
      1,
    )
  })

  it.each([
    [
      'missing recipient',
      (fixture: ReturnType<typeof makeFixture>) => {
        Object.assign(fixture.observation, {
          recipients: fixture.observation.recipients.slice(0, -1),
        })
      },
    ],
    [
      'foreign recipient',
      (fixture: ReturnType<typeof makeFixture>) => {
        fixture.observation.recipients[1].providerRecipientId = 'foreign'
      },
    ],
    [
      'duplicate recipient',
      (fixture: ReturnType<typeof makeFixture>) => {
        fixture.observation.recipients[1].providerRecipientId =
          fixture.observation.recipients[0].providerRecipientId
      },
    ],
    [
      'duplicate recipient item',
      (fixture: ReturnType<typeof makeFixture>) => {
        Object.assign(fixture.observation.recipients[0], {
          items: [
            ...fixture.observation.recipients[0].items,
            fixture.observation.recipients[0].items[0],
          ],
        })
      },
    ],
    [
      'missing recipient item',
      (fixture: ReturnType<typeof makeFixture>) => {
        Object.assign(fixture.observation.recipients[0], {
          items: fixture.observation.recipients[0].items.slice(0, -1),
        })
      },
    ],
  ])('rejects %s mapping before any transaction', async (_label, mutate) => {
    const fixture = makeFixture()
    mutate(fixture)
    fixture.provider.findEnvelopeState.mockResolvedValue(fixture.observation)
    await expect(
      useCase(fixture).execute({
        requestId: 'request-1',
        reason: 'scheduled',
        occurredAt: NOW,
      }),
    ).resolves.toEqual({ outcome: 'retry_required' })
    expect(fixture.transaction.recordProviderObservationAndDerive).not.toHaveBeenCalled()
  })

  it('returns retry_required on a batch transaction conflict without confirming', async () => {
    const fixture = makeFixture()
    fixture.transaction.recordProviderObservationAndDerive.mockResolvedValue('conflict')
    await expect(
      useCase(fixture).execute({
        requestId: 'request-1',
        reason: 'scheduled',
        occurredAt: NOW,
      }),
    ).resolves.toEqual({ outcome: 'retry_required' })
    expect(fixture.transaction.confirmEnvelopeAndDerive).not.toHaveBeenCalled()
  })

  it('preserves idempotency when every artifact and protocol already exists', async () => {
    const fixture = makeFixture()
    fixture.observation.envelopeStatus = 'completed'
    fixture.provider.findEnvelopeState.mockResolvedValue(fixture.observation)
    fixture.artifacts.findByRequestId.mockResolvedValue(
      fixture.itemResources.map((item, index) => ({
        id: `artifact-${index + 1}`,
        requestId: 'request-1',
        requestDocumentId: item.requestDocumentId,
        kind: 'signed_pdf' as const,
        privateFileId: `file-${index + 1}`,
        sha256: `hash-${index + 1}`,
        byteCount: 1,
        mediaType: 'application/pdf',
        preservedAt: NOW,
        createdAt: NOW,
      })),
    )
    fixture.protocols.findByRecipientAndRequest.mockImplementation(
      async ({ recipientId }) => ({
        id: `protocol-${recipientId}`,
        requestId: 'request-1',
        recipientId,
        number: `HMS-${recipientId}`,
        artifactSetHash: 'hash',
        confirmedAt: NOW,
      }),
    )
    await expect(
      useCase(fixture).execute({
        requestId: 'request-1',
        reason: 'scheduled',
        occurredAt: NOW,
      }),
    ).resolves.toEqual({ outcome: 'confirmed' })
    expect(fixture.storage.save).not.toHaveBeenCalled()
    expect(fixture.artifacts.add).not.toHaveBeenCalled()
    expect(fixture.protocols.add).not.toHaveBeenCalled()
    expect(fixture.transaction.confirmEnvelopeAndDerive).toHaveBeenCalledWith(
      expect.objectContaining({ artifactsToAdd: [], protocols: [] }),
    )
  })

  it('preserves request-scoped evidence and certificate artifacts with deterministic protocol hashes', async () => {
    const fixture = makeFixture()
    fixture.observation.envelopeStatus = 'completed'
    fixture.provider.downloadCompletedArtifacts.mockResolvedValue([
      ...fixture.itemResources.map((item, index) => ({
        kind: 'signed_pdf' as const,
        requestDocumentId: item.requestDocumentId,
        bytes: pdfBytes(index),
        mediaType: 'application/pdf',
      })),
      {
        kind: 'provider_evidence' as const,
        bytes: new Uint8Array([3]),
        mediaType: 'application/json',
        providerReference: 'evidence-1',
      },
      {
        kind: 'provider_certificate' as const,
        bytes: new Uint8Array([4]),
        mediaType: 'application/pkcs12',
        providerReference: 'certificate-1',
      },
    ])

    await expect(
      useCase(fixture).execute({
        requestId: 'request-1',
        reason: 'scheduled',
        occurredAt: NOW,
      }),
    ).resolves.toEqual({ outcome: 'confirmed' })
    const input = fixture.transaction.confirmEnvelopeAndDerive.mock.calls[0]?.[0]
    expect(input?.artifactsToAdd).toHaveLength(4)
    expect(
      input?.artifactsToAdd.filter((item) => item.kind === 'signed_pdf'),
    ).toHaveLength(2)
    expect(input?.artifactsToAdd.filter((item) => item.kind !== 'signed_pdf')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'provider_evidence',
          requestDocumentId: undefined,
        }),
        expect.objectContaining({
          kind: 'provider_certificate',
          requestDocumentId: undefined,
        }),
      ]),
    )
    expect(
      new Set(input?.protocols.map((protocol) => protocol.artifactSetHash)).size,
    ).toBe(1)
  })

  it.each([
    'duplicate',
    'foreign',
    'wrong scope',
  ] as const)('rejects %s provider artifact output before confirmation', async (kind) => {
    const fixture = makeFixture()
    fixture.observation.envelopeStatus = 'completed'
    const signed = fixture.itemResources.map((item, index) => ({
      kind: 'signed_pdf' as const,
      requestDocumentId: item.requestDocumentId,
      bytes: pdfBytes(index),
      mediaType: 'application/pdf',
    }))
    const firstSigned = signed[0]
    const secondSigned = signed[1]
    if (!firstSigned || !secondSigned) throw new Error('Expected two signed PDFs')
    fixture.provider.downloadCompletedArtifacts.mockResolvedValue(
      kind === 'duplicate'
        ? [firstSigned, firstSigned, secondSigned]
        : kind === 'foreign'
          ? [firstSigned, { ...secondSigned, requestDocumentId: 'foreign-document' }]
          : [
              ...signed,
              {
                kind: 'provider_evidence' as const,
                requestDocumentId: 'document-1',
                bytes: new Uint8Array([3]),
                mediaType: 'application/json',
              },
            ],
    )

    await expect(
      useCase(fixture).execute({
        requestId: 'request-1',
        reason: 'scheduled',
        occurredAt: NOW,
      }),
    ).resolves.toEqual({ outcome: 'retry_required' })
    expect(fixture.transaction.confirmEnvelopeAndDerive).not.toHaveBeenCalled()
  })

  it.each([
    [
      'missing artifact',
      (fixture: ReturnType<typeof makeFixture>) => {
        fixture.provider.downloadCompletedArtifacts.mockResolvedValue([])
      },
    ],
    [
      'storage failure',
      (fixture: ReturnType<typeof makeFixture>) => {
        fixture.storage.save.mockRejectedValue(new Error('storage'))
      },
    ],
    [
      'hash failure',
      (_fixture: ReturnType<typeof makeFixture>) => {
        vi.spyOn(globalThis.crypto.subtle, 'digest').mockRejectedValueOnce(
          new Error('hash'),
        )
      },
    ],
  ])('requires retry and never confirms on %s', async (_label, mutate) => {
    const fixture = makeFixture()
    fixture.observation.envelopeStatus = 'completed'
    fixture.provider.findEnvelopeState.mockResolvedValue(fixture.observation)
    mutate(fixture)
    await expect(
      useCase(fixture).execute({
        requestId: 'request-1',
        reason: 'scheduled',
        occurredAt: NOW,
      }),
    ).resolves.toEqual({ outcome: 'retry_required' })
    expect(fixture.transaction.confirmEnvelopeAndDerive).not.toHaveBeenCalled()
    vi.restoreAllMocks()
  })
})
