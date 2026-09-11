import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import type { File } from '../../../shared/domain/entities'
import type { FileStorageProvider, DatetimeProvider } from '../../../shared/interfaces'
import type {
  FormalizationSignatureConfigurationRepository,
  FormalizationSignatureSourceReader,
} from '../../interfaces'
import type { DocumentPdfFreezeService } from '../../../document-production/interfaces'
import { ProcessFormalizationSignaturePreviewUseCase } from '../process-formalization-signature-preview-use-case'
import {
  makeConfiguration,
  makeFormalization,
  TEST_NOW,
} from './signature-configuration-test-helpers'

describe('Process Formalization Signature Preview Use Case', () => {
  it('claims, converts, inspects and finalizes a preview', async () => {
    const formalization = makeFormalization()
    const baseConfiguration = makeConfiguration()
    const baseDocument = baseConfiguration.documents[0]
    if (!baseDocument?.preview) throw new Error('Expected a preview fixture')
    const configuration = makeConfiguration({
      formalizationId: formalization.id,
      documents: [
        { ...baseDocument, preview: { ...baseDocument.preview, state: 'pending' } },
      ],
    })
    const repository = mock<FormalizationSignatureConfigurationRepository>()
    const sourceReader = mock<FormalizationSignatureSourceReader>()
    const storage = mock<FileStorageProvider>()
    const freezeService = mock<DocumentPdfFreezeService>()
    const datetimeProvider = mock<DatetimeProvider>()
    const sourceFile: File = {
      id: 'source-file',
      filePath: 'source',
      fileName: 'contract.docx',
      contentType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      sizeInBytes: 3,
      createdAt: TEST_NOW,
    }
    repository.findByFormalizationId.mockResolvedValue(configuration)
    repository.claimPreview.mockResolvedValue({
      previewId: 'preview-id',
      attemptToken: 'attempt-token',
      leaseExpiresAt: new Date(TEST_NOW.getTime() + 1000),
    })
    sourceReader.findDocumentVersion.mockResolvedValue({
      documentId: 'document-id',
      documentVersionId: 'version-id',
      documentSpecificationId: 'specification-id',
      name: 'Contrato',
      reviewStatus: 'approved',
      fileId: sourceFile.id,
    })
    const pdfFile: File = {
      ...sourceFile,
      id: 'frozen-pdf',
      fileName: 'frozen.pdf',
      contentType: 'application/pdf',
      sizeInBytes: 4,
    }
    storage.get.mockResolvedValue({
      file: pdfFile,
      content: new Uint8Array([37, 80, 68, 70]),
    })
    freezeService.freeze.mockResolvedValue({
      id: 'frozen-id', documentId: 'document-id', documentVersionId: 'version-id',
      documentVersionNumber: 1, documentSpecificationId: 'specification-id', source: 'manual',
      sourceFileId: sourceFile.id, pdfFileId: pdfFile.id, sourceSha256: 'a'.repeat(64),
      pdfSha256: 'b'.repeat(64), converterVersion: 'v1', pageCount: 1,
      pages: [{ page: 1, width: 612, height: 792 }], byteSize: 4,
      approvedByCollaboratorId: 'reviewer', approvedAt: TEST_NOW, frozenAt: TEST_NOW,
      createdAt: TEST_NOW,
    })
    storage.save.mockResolvedValue({
      ...sourceFile,
      id: 'pdf-file',
      fileName: 'preview.pdf',
      contentType: 'application/pdf',
    })
    repository.finalizePreview.mockResolvedValue(true)
    datetimeProvider.now.mockReturnValue(TEST_NOW)

    await expect(
      new ProcessFormalizationSignaturePreviewUseCase(
        repository,
        sourceReader,
        storage,
        freezeService,
        datetimeProvider,
      ).execute({
        formalizationId: formalization.id,
        previewId: 'preview-id',
        attemptToken: 'attempt-token',
      }),
    ).resolves.toEqual({ previewId: 'preview-id', state: 'ready' })
    expect(repository.finalizePreview).toHaveBeenCalledOnce()
    expect(repository.finalizePreview).toHaveBeenCalledWith({
      preview: expect.objectContaining({
        contentChecksumSha256: expect.stringMatching(/^[a-f0-9]{64}$/),
        pdfChecksumSha256: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
      attemptToken: 'attempt-token',
      leaseExpiresAt: expect.any(Date),
    })
  })
})
