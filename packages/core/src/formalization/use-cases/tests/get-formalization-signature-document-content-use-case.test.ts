import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import {
  fakeFormalization,
  fakeFormalizationSignatureArtifact,
  fakeFormalizationSignatureRequest,
  fakeFormalizationSignatureRequestDocument,
} from '../../domain/entities/fakers'
import type {
  FormalizationsRepository,
  FormalizationSignatureArtifactsRepository,
  FormalizationSignatureRequestDocumentsRepository,
  FormalizationSignatureRequestsRepository,
} from '../../interfaces'
import type { FileStorageProvider } from '../../../shared/interfaces'
import { GetFormalizationSignatureDocumentContentUseCase } from '../get-formalization-signature-document-content-use-case'

describe('Get Formalization Signature Document Content Use Case', () => {
  it('returns the preserved original and signed PDFs after request confirmation', async () => {
    const formalization = fakeFormalization()
    const signatureRequest = fakeFormalizationSignatureRequest({
      formalizationId: formalization.id,
      status: 'confirmed',
    })
    const document = fakeFormalizationSignatureRequestDocument({
      requestId: signatureRequest.id,
      status: 'confirmed',
      unsignedPrivateFileId: 'original-file',
    })
    const signedArtifact = fakeFormalizationSignatureArtifact({
      requestId: signatureRequest.id,
      requestDocumentId: document.id,
      kind: 'signed_pdf',
      privateFileId: 'signed-file',
    })
    const formalizationsRepository = mock<FormalizationsRepository>()
    const requestsRepository = mock<FormalizationSignatureRequestsRepository>()
    const documentsRepository = mock<FormalizationSignatureRequestDocumentsRepository>()
    const artifactsRepository = mock<FormalizationSignatureArtifactsRepository>()
    const fileStorageProvider = mock<FileStorageProvider>()
    formalizationsRepository.findById.mockResolvedValue(formalization)
    requestsRepository.findLatestByFormalizationId.mockResolvedValue(signatureRequest)
    documentsRepository.findById.mockResolvedValue(document)
    artifactsRepository.findByRequestDocumentId.mockResolvedValue([signedArtifact])
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
    const useCase = new GetFormalizationSignatureDocumentContentUseCase({
      formalizationsRepository,
      requestsRepository,
      documentsRepository,
      artifactsRepository,
      fileStorageProvider,
    })
    const actor = {
      formalizationId: formalization.id,
      requestDocumentId: document.id,
      actorId: formalization.assignedLawyerId,
    }

    await expect(
      useCase.execute({ ...actor, contentKind: 'original' }),
    ).resolves.toMatchObject({ file: { id: 'original-file' } })
    await expect(
      useCase.execute({ ...actor, contentKind: 'signed' }),
    ).resolves.toMatchObject({ file: { id: 'signed-file' } })
  })

  it('does not expose files before every required signature is confirmed', async () => {
    const formalization = fakeFormalization()
    const formalizationsRepository = mock<FormalizationsRepository>()
    const requestsRepository = mock<FormalizationSignatureRequestsRepository>()
    formalizationsRepository.findById.mockResolvedValue(formalization)
    requestsRepository.findLatestByFormalizationId.mockResolvedValue(
      fakeFormalizationSignatureRequest({
        formalizationId: formalization.id,
        status: 'in_progress',
      }),
    )
    const useCase = new GetFormalizationSignatureDocumentContentUseCase({
      formalizationsRepository,
      requestsRepository,
      documentsRepository: mock<FormalizationSignatureRequestDocumentsRepository>(),
      artifactsRepository: mock<FormalizationSignatureArtifactsRepository>(),
      fileStorageProvider: mock<FileStorageProvider>(),
    })

    await expect(
      useCase.execute({
        formalizationId: formalization.id,
        requestDocumentId: 'document-id',
        contentKind: 'original',
        actorId: formalization.assignedLawyerId,
      }),
    ).rejects.toMatchObject({ title: 'Assinatura indisponível' })
  })
})
