import { DocumentBatchChannel, DocumentValidationStatus } from '../../domain/structures'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mock } from 'vitest-mock-extended'
import { CompleteClientDocumentUploadUseCase } from '../complete-client-document-upload-use-case'
import type {
  ClientDocumentsRepository,
  ClientDocumentUploadsRepository,
  DocumentBatchesRepository,
  ClientDocumentReceiptTransactionProvider,
} from '../../interfaces'
import type { StorageProvider } from '#shared/interfaces'
import type { CollaboratorsRepository } from '#identity/interfaces'
import { CollaboratorFaker } from '#identity/domain/entities/fakers'
import {
  ClientDocumentUploadFaker,
  ClientDocumentFaker,
  DocumentBatchFileFaker,
  DocumentBatchFaker,
} from '../../domain/entities/fakers'
describe('Complete client upload', () => {
  const uploads = mock<ClientDocumentUploadsRepository>()
  const documents = mock<ClientDocumentsRepository>()
  const batches = mock<DocumentBatchesRepository>()
  const storage = mock<StorageProvider>()
  const collaborators = mock<CollaboratorsRepository>()
  const transaction = mock<ClientDocumentReceiptTransactionProvider>()
  const actor = CollaboratorFaker.legal()
  const upload = ClientDocumentUploadFaker.fake({ actorId: actor.id })
  const file = DocumentBatchFileFaker.fake({ storagePath: upload.storagePath })
  const batch = DocumentBatchFaker.fake({ files: [file], clientId: upload.clientId })
  const document = ClientDocumentFaker.fake({
    source: { kind: 'received_file', fileId: file.id },
    clientId: upload.clientId,
  })
  const useCase = new CompleteClientDocumentUploadUseCase(
    uploads,
    documents,
    batches,
    storage,
    collaborators,
    transaction,
  )
  const request = {
    caseId: upload.caseId,
    checklistItemId: upload.checklistItemId,
    clientId: upload.clientId,
    actorId: upload.actorId,
    uploadId: upload.id,
  }
  beforeEach(() => {
    vi.clearAllMocks()
    uploads.findById.mockResolvedValue(upload)
    documents.add.mockResolvedValue(document)
    documents.findById.mockResolvedValue(document)
    batches.add.mockResolvedValue(batch)
    batches.findFileById.mockResolvedValue(file)
    storage.inspect.mockResolvedValue({
      mimeType: upload.mimeType,
      sizeBytes: upload.sizeBytes,
    })
    storage.download.mockResolvedValue(new TextEncoder().encode('%PDF-'))
    collaborators.findById.mockResolvedValue(actor)
    transaction.runInTransaction.mockImplementation(async (operation) => operation())
  })
  it('records a confirmed contextual receipt awaiting human validation without processing acceptance', async () => {
    expect(await useCase.execute(request)).toBe(document)
    expect(batches.add).toHaveBeenCalledWith(
      expect.objectContaining({
        inTriageBox: false,
        createdBy: actor.userId,
        channel: DocumentBatchChannel.InternalUpload,
        files: [
          expect.objectContaining({
            status: DocumentValidationStatus.AwaitingValidation,
          }),
        ],
      }),
    )
    expect(batches.add.mock.calls[0][0].clientId).toBeUndefined()
    expect(batches.add.mock.calls[0][0].files[0]).toMatchObject({
      caseId: upload.caseId,
      checklistItemId: upload.checklistItemId,
    })
    expect(uploads.replace).toHaveBeenCalledWith(upload.id, {
      clientDocumentId: document.id,
    })
    expect(uploads.replace).toHaveBeenCalledTimes(1)
  })
  it('retries a committed original without creating another receipt or publishing processing', async () => {
    await expect(useCase.execute(request)).resolves.toBe(document)
    uploads.findById.mockResolvedValue({ ...upload, clientDocumentId: document.id })
    await expect(useCase.execute(request)).resolves.toBe(document)
    expect(batches.add).toHaveBeenCalledTimes(1)
    expect(documents.add).toHaveBeenCalledTimes(1)
    expect(uploads.replace).toHaveBeenCalledTimes(1)
  })
  it('replays an accepted durable receipt without republishing', async () => {
    uploads.findById.mockResolvedValue({
      ...upload,
      clientDocumentId: document.id,
      processingAcceptedAt: new Date(),
    })
    await expect(useCase.execute(request)).resolves.toBe(document)
    expect(batches.add).not.toHaveBeenCalled()
  })
  it('rejects foreign target context without inspecting bytes', async () => {
    await expect(
      useCase.execute({ ...request, checklistItemId: 'foreign' }),
    ).rejects.toThrow()
    expect(storage.inspect).not.toHaveBeenCalled()
  })
  it('rejects missing upload bytes', async () => {
    storage.inspect.mockResolvedValue(undefined)
    await expect(useCase.execute(request)).rejects.toThrow()
    expect(batches.add).not.toHaveBeenCalled()
  })
  it('rejects mismatched metadata', async () => {
    storage.inspect.mockResolvedValue({
      mimeType: 'image/jpeg',
      sizeBytes: upload.sizeBytes,
    })
    await expect(useCase.execute(request)).rejects.toThrow()
    expect(batches.add).not.toHaveBeenCalled()
  })
  it('rejects forged file magic without recording a receipt', async () => {
    storage.download.mockResolvedValue(new TextEncoder().encode('XXXXX'))
    await expect(useCase.execute(request)).rejects.toThrow()
    expect(batches.add).not.toHaveBeenCalled()
  })
  it.each([
    ['JPEG', 'image/jpeg', [255, 216, 255]],
    ['PNG', 'image/png', [137, 80, 78, 71, 13, 10, 26, 10]],
  ] as const)('accepts a verified %s original with its matching declared size', async (_name, mimeType, signature) => {
    const bytes = new Uint8Array(signature)
    uploads.findById.mockResolvedValue({ ...upload, mimeType, sizeBytes: bytes.length })
    storage.inspect.mockResolvedValue({ mimeType, sizeBytes: bytes.length })
    storage.download.mockResolvedValue(bytes)
    await expect(useCase.execute(request)).resolves.toBe(document)
    expect(batches.add).toHaveBeenCalledWith(
      expect.objectContaining({
        files: [expect.objectContaining({ mimeType, sizeBytes: bytes.length })],
      }),
    )
  })
  it.each([
    ['JPEG', 'image/jpeg', [255, 0, 255]],
    ['PNG', 'image/png', [137, 80, 78, 71, 13, 10, 0, 10]],
    ['truncated PNG', 'image/png', [137, 80]],
  ] as const)('rejects forged %s bytes despite matching metadata', async (_name, mimeType, signature) => {
    const bytes = new Uint8Array(signature)
    uploads.findById.mockResolvedValue({ ...upload, mimeType, sizeBytes: bytes.length })
    storage.inspect.mockResolvedValue({ mimeType, sizeBytes: bytes.length })
    storage.download.mockResolvedValue(bytes)
    await expect(useCase.execute(request)).rejects.toThrow()
    expect(batches.add).not.toHaveBeenCalled()
  })
  it('rejects a vanished upload before Storage or receipt side effects', async () => {
    uploads.findById.mockResolvedValue(undefined)
    await expect(useCase.execute(request)).rejects.toThrow()
    expect(storage.inspect).not.toHaveBeenCalled()
    expect(batches.add).not.toHaveBeenCalled()
  })
  it('rejects a durable receipt whose referenced document vanished', async () => {
    uploads.findById.mockResolvedValue({ ...upload, clientDocumentId: document.id })
    documents.findById.mockResolvedValue(undefined)
    await expect(useCase.execute(request)).rejects.toThrow()
    expect(batches.add).not.toHaveBeenCalled()
  })
  it('rejects a vanished durable original without new receipt effects', async () => {
    uploads.findById.mockResolvedValue({ ...upload, clientDocumentId: document.id })
    batches.findFileById.mockResolvedValue(undefined)
    await expect(useCase.execute(request)).rejects.toThrow()
    expect(uploads.replace).not.toHaveBeenCalled()
  })
  it('rejects a lost actor before creating the contextual receipt', async () => {
    collaborators.findById.mockResolvedValue(undefined)
    await expect(useCase.execute(request)).rejects.toThrow()
    expect(batches.add).not.toHaveBeenCalled()
  })
  it('rejects incomplete persistence instead of associating a missing original', async () => {
    batches.add.mockResolvedValue(DocumentBatchFaker.fake({ files: [] }))
    await expect(useCase.execute(request)).rejects.toThrow()
    expect(documents.add).not.toHaveBeenCalled()
    expect(uploads.replace).not.toHaveBeenCalled()
  })
  it('rejects a size changed between metadata inspection and download', async () => {
    storage.download.mockResolvedValue(new TextEncoder().encode('%PDF-extra'))
    await expect(useCase.execute(request)).rejects.toThrow()
    expect(batches.add).not.toHaveBeenCalled()
  })
})
