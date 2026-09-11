import { describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import type { DatetimeProvider } from '../../../shared/interfaces'
import {
  fakeFormalizationSignatureGatewaySession,
  fakeFormalizationSignatureRecipient,
  fakeFormalizationSignatureRequest,
  fakeFormalizationSignatureRequestDocument,
} from '../../domain/entities/fakers'
import type { FormalizationSignatureAuthenticationSource } from '../../domain/structures'
import type {
  FormalizationSignatureGatewaySessionsRepository,
  FormalizationSignatureRecipientDocumentsRepository,
  FormalizationSignatureRecipientsRepository,
  FormalizationSignatureRequestDocumentsRepository,
  FormalizationSignatureRequestsRepository,
  FormalizationSignatureSourceReader,
  SignatureSecretHasher,
} from '../../interfaces'
import { GetSignatureDocumentUseCase } from '../get-signature-document-use-case'

const NOW = new Date('2026-09-02T20:00:00.000Z')

type Dependencies = {
  sessionsRepository: MockProxy<FormalizationSignatureGatewaySessionsRepository>
  documentsRepository: MockProxy<FormalizationSignatureRequestDocumentsRepository>
  requestsRepository: MockProxy<FormalizationSignatureRequestsRepository>
  recipientsRepository: MockProxy<FormalizationSignatureRecipientsRepository>
  assignmentsRepository: MockProxy<FormalizationSignatureRecipientDocumentsRepository>
  sourceReader: MockProxy<FormalizationSignatureSourceReader>
  hasher: MockProxy<SignatureSecretHasher>
  datetimeProvider: MockProxy<DatetimeProvider>
}

function makeDependencies(): Dependencies {
  const dependencies: Dependencies = {
    sessionsRepository: mock<FormalizationSignatureGatewaySessionsRepository>(),
    documentsRepository: mock<FormalizationSignatureRequestDocumentsRepository>(),
    requestsRepository: mock<FormalizationSignatureRequestsRepository>(),
    recipientsRepository: mock<FormalizationSignatureRecipientsRepository>(),
    assignmentsRepository: mock<FormalizationSignatureRecipientDocumentsRepository>(),
    sourceReader: mock<FormalizationSignatureSourceReader>(),
    hasher: mock<SignatureSecretHasher>(),
    datetimeProvider: mock<DatetimeProvider>(),
  }
  dependencies.datetimeProvider.now.mockReturnValue(NOW)
  dependencies.hasher.hash.mockImplementation((value) => `${value}-hash`)
  dependencies.sessionsRepository.findByTokenHash.mockResolvedValue(
    fakeFormalizationSignatureGatewaySession({
      id: 'session-1',
      requestId: 'request-1',
      recipientId: 'recipient-1',
      snapshotId: 'snapshot-1',
      kind: 'authenticated',
      status: 'active',
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
  dependencies.assignmentsRepository.listByRecipientId.mockResolvedValue([
    {
      id: 'assignment-1',
      requestId: 'request-1',
      recipientId: 'recipient-1',
      requestDocumentId: 'request-document-1',
      createdAt: NOW,
    },
  ])
  dependencies.documentsRepository.findById.mockResolvedValue(
    fakeFormalizationSignatureRequestDocument({
      id: 'request-document-1',
      requestId: 'request-1',
      sourceDocumentId: 'source-document-1',
      sourceDocumentVersionId: 'source-version-1',
      status: 'provisioned',
      unsignedPrivateFileId: 'private-file-1',
      unsignedSha256: 'sha256-1',
      byteCount: 42,
      pageCount: 2,
    }),
  )
  dependencies.sourceReader.findAuthenticationSource.mockResolvedValue({
    personId: 'person-1',
    actorKind: 'client',
    active: true,
    channels: [],
  })
  dependencies.sourceReader.findDocumentVersion.mockResolvedValue({
    documentId: 'source-document-1',
    documentVersionId: 'source-version-1',
    documentSpecificationId: 'source-specification-1',
    name: 'Contrato imutável',
    reviewStatus: 'approved',
    fileId: 'source-file-1',
  })
  return dependencies
}

function execute(dependencies: Dependencies, actorId?: string) {
  return new GetSignatureDocumentUseCase(dependencies).execute({
    sessionToken: 'token',
    deviceToken: 'device',
    requestDocumentId: 'request-document-1',
    ...(actorId ? { actorId } : {}),
  })
}

describe('Get Signature Document Use Case', () => {
  it('returns only private PDF metadata from the exact request snapshot', async () => {
    await expect(execute(makeDependencies())).resolves.toEqual({
      privateFileId: 'private-file-1',
      title: 'Contrato imutável',
      mediaType: 'application/pdf',
      byteCount: 42,
      sha256: 'sha256-1',
    })
  })

  it('ignores a coexisting HMS actor while a client reads a private PDF', async () => {
    await expect(execute(makeDependencies(), 'signed-in-admin')).resolves.toMatchObject({
      privateFileId: 'private-file-1',
    })
  })

  it.each([
    { label: 'revoked', status: 'revoked' as const },
    { label: 'expired', status: 'expired' as const },
  ])('rejects a $label session', async ({ status }) => {
    const dependencies = makeDependencies()
    dependencies.sessionsRepository.findByTokenHash.mockResolvedValue(
      fakeFormalizationSignatureGatewaySession({ kind: 'authenticated', status }),
    )
    await expect(execute(dependencies)).rejects.toThrow()
    expect(dependencies.requestsRepository.findById).not.toHaveBeenCalled()
  })

  it('rejects an exact expiry, device mismatch, foreign request, snapshot, recipient, and document', async () => {
    const dependencies = makeDependencies()
    dependencies.sessionsRepository.findByTokenHash.mockResolvedValue(
      fakeFormalizationSignatureGatewaySession({
        kind: 'authenticated',
        requestId: 'request-1',
        recipientId: 'recipient-1',
        snapshotId: 'snapshot-1',
        expiresAt: NOW,
      }),
    )
    await expect(execute(dependencies)).rejects.toThrow()

    dependencies.sessionsRepository.findByTokenHash.mockResolvedValue(
      fakeFormalizationSignatureGatewaySession({
        kind: 'authenticated',
        requestId: 'request-1',
        recipientId: 'recipient-1',
        snapshotId: 'snapshot-1',
        expiresAt: new Date(NOW.getTime() + 60_000),
      }),
    )
    await expect(
      new GetSignatureDocumentUseCase(dependencies).execute({
        sessionToken: 'token',
        deviceToken: 'other-device',
        requestDocumentId: 'request-document-1',
      }),
    ).rejects.toThrow()

    dependencies.requestsRepository.findById.mockResolvedValue(
      fakeFormalizationSignatureRequest({
        id: 'foreign-request',
        snapshotId: 'snapshot-1',
      }),
    )
    await expect(execute(dependencies)).rejects.toThrow()

    dependencies.requestsRepository.findById.mockResolvedValue(
      fakeFormalizationSignatureRequest({
        id: 'request-1',
        snapshotId: 'foreign-snapshot',
      }),
    )
    await expect(execute(dependencies)).rejects.toThrow()

    dependencies.requestsRepository.findById.mockResolvedValue(
      fakeFormalizationSignatureRequest({ id: 'request-1', snapshotId: 'snapshot-1' }),
    )
    dependencies.recipientsRepository.findById.mockResolvedValue(
      fakeFormalizationSignatureRecipient({
        id: 'foreign-recipient',
        requestId: 'request-1',
      }),
    )
    await expect(execute(dependencies)).rejects.toThrow()

    dependencies.recipientsRepository.findById.mockResolvedValue(
      fakeFormalizationSignatureRecipient({
        id: 'recipient-1',
        requestId: 'request-1',
        status: 'reading',
      }),
    )
    dependencies.documentsRepository.findById.mockResolvedValue(
      fakeFormalizationSignatureRequestDocument({
        id: 'request-document-1',
        requestId: 'foreign-request',
      }),
    )
    await expect(execute(dependencies)).rejects.toThrow()
  })

  it.each([
    { requestStatus: 'provisioning' as const, recipientStatus: 'reading' as const },
    { requestStatus: 'in_progress' as const, recipientStatus: 'confirmed' as const },
    { requestStatus: 'in_progress' as const, recipientStatus: 'cancelled' as const },
    {
      requestStatus: 'in_progress' as const,
      recipientStatus: 'reading' as const,
      documentStatus: 'failed' as const,
    },
  ])('fails closed for non-signable request, recipient, or document state', async ({
    requestStatus,
    recipientStatus,
    documentStatus,
  }) => {
    const dependencies = makeDependencies()
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
    if (documentStatus)
      dependencies.documentsRepository.findById.mockResolvedValue(
        fakeFormalizationSignatureRequestDocument({
          id: 'request-document-1',
          requestId: 'request-1',
          status: documentStatus,
        }),
      )
    await expect(execute(dependencies)).rejects.toThrow()
  })

  it('revalidates collaborator identity, role, assignment and actor id on every read', async () => {
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
      collaboratorRole: 'supervisor',
      channels: [],
    })
    await expect(execute(dependencies, 'collaborator-1')).resolves.toBeTruthy()

    const sources: FormalizationSignatureAuthenticationSource[] = [
      {
        personId: 'other',
        actorKind: 'collaborator' as const,
        active: true,
        collaboratorRole: 'lawyer' as const,
        channels: [],
      },
      {
        personId: 'collaborator-1',
        actorKind: 'collaborator' as const,
        active: false,
        collaboratorRole: 'lawyer' as const,
        channels: [],
      },
      {
        personId: 'collaborator-1',
        actorKind: 'collaborator' as const,
        active: true,
        channels: [],
      },
    ]
    for (const source of sources) {
      dependencies.sourceReader.findAuthenticationSource.mockResolvedValue(source)
      await expect(execute(dependencies, 'collaborator-1')).rejects.toThrow()
    }
    dependencies.sourceReader.findAuthenticationSource.mockResolvedValue({
      personId: 'collaborator-1',
      actorKind: 'collaborator',
      active: true,
      collaboratorRole: 'lawyer',
      channels: [],
    })
    dependencies.assignmentsRepository.listByRecipientId.mockResolvedValue([])
    await expect(execute(dependencies, 'collaborator-1')).rejects.toThrow()
    await expect(execute(dependencies, 'other-collaborator')).rejects.toThrow()
  })
})
