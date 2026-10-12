import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import type { CaseAccessProvider } from '../../../case-management/interfaces/case-access-provider'
import type { StorageProvider } from '../../../shared/interfaces/storage-provider'
import { DocumentValidationDocumentFaker } from '../../domain/entities/fakers'
import { DocumentFileNotFoundError } from '../../domain/errors'
import type {
  DocumentBatchesRepository,
  DocumentValidationsRepository,
} from '../../interfaces'
import { DownloadDocumentFileUseCase } from '../download-document-file-use-case'

describe('Download Document File Use Case', () => {
  let batches: MockProxy<DocumentBatchesRepository>
  let validations: MockProxy<DocumentValidationsRepository>
  let storage: MockProxy<StorageProvider>
  let access: MockProxy<CaseAccessProvider>
  let useCase: DownloadDocumentFileUseCase

  beforeEach(() => {
    batches = mock<DocumentBatchesRepository>()
    validations = mock<DocumentValidationsRepository>()
    storage = mock<StorageProvider>()
    access = mock<CaseAccessProvider>()
    useCase = new DownloadDocumentFileUseCase(batches, validations, storage, access)
  })

  it('authorizes the persisted Case owner before reading bytes', async () => {
    validations.findByFileId.mockResolvedValue(
      DocumentValidationDocumentFaker.fake({
        id: 'file-1',
        checklistLink: { caseId: 'case-1' },
      }),
    )
    batches.findFileById.mockResolvedValue({
      id: 'file-1',
      batchId: 'batch-1',
      storagePath: 'private/file.pdf',
      originalName: 'file.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 4,
      createdAt: new Date(),
    })
    storage.download.mockResolvedValue(new Uint8Array([1, 2, 3, 4]))

    const result = await useCase.execute({ fileId: 'file-1', actorId: 'collaborator-1' })

    expect(result).toEqual({
      content: new Uint8Array([1, 2, 3, 4]),
      mimeType: 'application/pdf',
      fileName: 'file.pdf',
    })
    expect(access.authorize).toHaveBeenCalledWith({
      caseId: 'case-1',
      actorId: 'collaborator-1',
      intent: 'read_content',
    })
    expect(access.authorize.mock.invocationCallOrder[0]).toBeLessThan(
      storage.download.mock.invocationCallOrder[0],
    )
  })

  it('does not read file metadata or bytes when current access is denied', async () => {
    validations.findByFileId.mockResolvedValue(
      DocumentValidationDocumentFaker.fake({
        id: 'file-1',
        checklistLink: { caseId: 'case-1' },
      }),
    )
    access.authorize.mockRejectedValue(new Error('denied'))

    await expect(
      useCase.execute({ fileId: 'file-1', actorId: 'removed-collaborator' }),
    ).rejects.toThrow('denied')
    expect(batches.findFileById).not.toHaveBeenCalled()
    expect(storage.download).not.toHaveBeenCalled()
  })

  it('does not require case authorization when validation has no case link', async () => {
    validations.findByFileId.mockResolvedValue(
      DocumentValidationDocumentFaker.fake({ id: 'file-1', checklistLink: undefined }),
    )
    batches.findFileById.mockResolvedValue({
      id: 'file-1',
      batchId: 'batch-1',
      storagePath: 'private/file.pdf',
      originalName: 'file.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 4,
      createdAt: new Date(),
    })
    storage.download.mockResolvedValue(new Uint8Array([1]))

    await useCase.execute({ fileId: 'file-1', actorId: 'collaborator-1' })

    expect(access.authorize).not.toHaveBeenCalled()
    expect(batches.findFileById).toHaveBeenCalledWith('file-1')
    expect(storage.download).toHaveBeenCalledWith('private/file.pdf')
  })

  it('fails when the file is missing before downloading from storage', async () => {
    validations.findByFileId.mockResolvedValue(undefined)
    batches.findFileById.mockResolvedValue(undefined)

    await expect(
      useCase.execute({ fileId: 'missing-file', actorId: 'collaborator-1' }),
    ).rejects.toThrow(DocumentFileNotFoundError)

    expect(access.authorize).not.toHaveBeenCalled()
    expect(storage.download).not.toHaveBeenCalled()
  })
})
