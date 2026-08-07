import { describe, expect, it, beforeEach } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import { GetDocumentFileUseCase } from '../get-document-file-use-case'
import { DocumentFileNotFoundError } from '../../domain/errors/document-file-not-found-error'
import type { DocumentBatchesRepository } from '../../interfaces/document-batches-repository'
import type { DocumentBatchFile } from '../../domain/entities/document-batch'

describe('GetDocumentFileUseCase', () => {
  let documentBatchesRepository: MockProxy<DocumentBatchesRepository>
  let useCase: GetDocumentFileUseCase

  beforeEach(() => {
    documentBatchesRepository = mock<DocumentBatchesRepository>()
    useCase = new GetDocumentFileUseCase(documentBatchesRepository)
  })

  it('should return the document file when it exists', async () => {
    const mockFile: DocumentBatchFile = {
      id: 'file-123',
      batchId: 'batch-456',
      storagePath: 'client/file-123.pdf',
      originalName: 'test.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1024,
      createdAt: new Date(),
    }

    documentBatchesRepository.findFileById.mockResolvedValue(mockFile)

    const result = await useCase.execute({ fileId: 'file-123' })

    expect(result).toEqual(mockFile)
    expect(documentBatchesRepository.findFileById).toHaveBeenCalledWith('file-123')
  })

  it('should throw DocumentFileNotFoundError when the file does not exist', async () => {
    documentBatchesRepository.findFileById.mockResolvedValue(undefined)

    await expect(useCase.execute({ fileId: 'missing-file' })).rejects.toThrow(
      DocumentFileNotFoundError
    )
  })
})