import request from 'supertest'
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mocked,
} from 'vitest'
import {
  fakeFormalization,
  fakeFormalizationSignatureArtifact,
  fakeFormalizationSignatureRequest,
  fakeFormalizationSignatureRequestDocument,
  fakeFormalizationSignatureSnapshot,
} from '@hms/core/formalization/domain/entities/fakers'
import type {
  FormalizationSignatureArtifactsRepository,
  FormalizationSignatureRequestDocumentsRepository,
  FormalizationSignatureRequestsRepository,
  FormalizationSignatureSnapshotsRepository,
} from '@hms/core/formalization/interfaces'
import type { FileStorageProvider } from '@hms/core/shared/interfaces'

import { FORMALIZATION_REPOSITORIES } from '@/formalization/constants'
import { FormalizationModuleFixture } from '@/formalization/fixtures'
import { PROVISION_PROVIDERS } from '@/shared/provision/constants/provision-providers'

describe('Get Formalization Signature Document Content Controller [GET /formalizations/:formalizationId/signature-sending/documents/:requestDocumentId/:contentKind]', () => {
  let fixture: FormalizationModuleFixture
  let fileStorageProvider: Mocked<FileStorageProvider>
  let snapshotsRepository: FormalizationSignatureSnapshotsRepository
  let requestsRepository: FormalizationSignatureRequestsRepository
  let documentsRepository: FormalizationSignatureRequestDocumentsRepository
  let artifactsRepository: FormalizationSignatureArtifactsRepository

  beforeAll(async () => {
    fileStorageProvider = {
      save: vi.fn(),
      get: vi.fn(),
      remove: vi.fn(),
    }
    fixture = await FormalizationModuleFixture.register((builder) =>
      builder
        .overrideProvider(PROVISION_PROVIDERS.fileStorage)
        .useValue(fileStorageProvider),
    )
    snapshotsRepository = fixture.app.get(FORMALIZATION_REPOSITORIES.signatureSnapshots)
    requestsRepository = fixture.app.get(FORMALIZATION_REPOSITORIES.signatureRequests)
    documentsRepository = fixture.app.get(
      FORMALIZATION_REPOSITORIES.signatureRequestDocuments,
    )
    artifactsRepository = fixture.app.get(FORMALIZATION_REPOSITORIES.signatureArtifacts)
  })

  beforeEach(async () => {
    await fixture.resetDatabase()
    fileStorageProvider.get.mockReset()
  })

  afterAll(async () => fixture?.close())

  it('returns original and signed PDFs for a confirmed signature request', async () => {
    const formalizationId = fixture.idProvider.generate()
    const snapshot = fakeFormalizationSignatureSnapshot({
      formalizationId,
      createdBy: fixture.authUser.id,
    })
    const signatureRequest = fakeFormalizationSignatureRequest({
      formalizationId,
      snapshotId: snapshot.id,
      createdBy: fixture.authUser.id,
      status: 'confirmed',
    })
    const document = fakeFormalizationSignatureRequestDocument({
      requestId: signatureRequest.id,
      unsignedPrivateFileId: fixture.idProvider.generate(),
      status: 'confirmed',
    })
    const signedFileId = fixture.idProvider.generate()
    await fixture.formalizationsRepository.addOrGet(
      fakeFormalization({
        id: formalizationId,
        assignedLawyerId: fixture.collaboratorId,
      }),
    )
    await snapshotsRepository.add(snapshot)
    await requestsRepository.add(signatureRequest)
    await documentsRepository.addMany([document])
    await artifactsRepository.add(
      fakeFormalizationSignatureArtifact({
        requestId: signatureRequest.id,
        requestDocumentId: document.id,
        kind: 'signed_pdf',
        privateFileId: signedFileId,
      }),
    )
    fileStorageProvider.get.mockImplementation(async (fileId) => ({
      file: {
        id: fileId,
        filePath: `${fileId}.pdf`,
        fileName: `${fileId}.pdf`,
        contentType: 'application/pdf',
        sizeInBytes: 4,
        createdAt: new Date('2026-09-21T12:00:00.000Z'),
      },
      content: new Uint8Array([37, 80, 68, 70]),
    }))

    const [originalResponse, signedResponse] = await Promise.all([
      request(fixture.app.getHttpServer()).get(
        `/formalizations/${formalizationId}/signature-sending/documents/${document.id}/original`,
      ),
      request(fixture.app.getHttpServer()).get(
        `/formalizations/${formalizationId}/signature-sending/documents/${document.id}/signed`,
      ),
    ])

    expect(originalResponse.status).toBe(200)
    expect(originalResponse.headers['content-type']).toContain('application/pdf')
    expect(signedResponse.status).toBe(200)
    expect(signedResponse.headers['content-type']).toContain('application/pdf')
    expect(fileStorageProvider.get).toHaveBeenCalledWith(document.unsignedPrivateFileId)
    expect(fileStorageProvider.get).toHaveBeenCalledWith(signedFileId)
  })

  it('rejects an invalid document identifier at the HTTP boundary', async () => {
    const response = await request(fixture.app.getHttpServer()).get(
      '/formalizations/00000000-0000-4000-8000-000000000001/signature-sending/documents/not-a-uuid/original',
    )

    expect(response.status).toBe(400)
  })

  it('rejects an unsupported document content kind at the HTTP boundary', async () => {
    const response = await request(fixture.app.getHttpServer()).get(
      '/formalizations/00000000-0000-4000-8000-000000000001/signature-sending/documents/00000000-0000-4000-8000-000000000002/unsupported',
    )

    expect(response.status).toBe(400)
  })
})
