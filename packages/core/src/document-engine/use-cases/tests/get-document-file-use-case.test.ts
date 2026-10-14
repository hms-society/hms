import { describe, expect, it, beforeEach } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import { GetDocumentFileUseCase } from '../get-document-file-use-case'
import { DocumentFileNotFoundError } from '../../domain/errors/document-file-not-found-error'
import type { DocumentBatchesRepository } from '../../interfaces/document-batches-repository'
import type { DocumentValidationsRepository } from '../../interfaces/document-validations-repository'
import type { CaseAccessProvider } from '../../../case-management/interfaces/case-access-provider'
import { DocumentValidationDocumentFaker } from '../../domain/entities/fakers'
import type { DocumentBatchFile } from '../../domain/entities/document-batch'

describe('GetDocumentFileUseCase', () => {
  let documentBatchesRepository: MockProxy<DocumentBatchesRepository>
  let documentValidationsRepository: MockProxy<DocumentValidationsRepository>
  let caseAccessProvider: MockProxy<CaseAccessProvider>
  let useCase: GetDocumentFileUseCase

  beforeEach(() => {
    documentBatchesRepository = mock<DocumentBatchesRepository>()
    documentValidationsRepository = mock<DocumentValidationsRepository>()
    caseAccessProvider = mock<CaseAccessProvider>()
    useCase = new GetDocumentFileUseCase(
      documentBatchesRepository,
      documentValidationsRepository,
      caseAccessProvider,
    )
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

    const result = await useCase.execute({ fileId: 'file-123', actorId: 'actor-1' })

    expect(result).toEqual(mockFile)
    expect(documentBatchesRepository.findFileById).toHaveBeenCalledWith('file-123')
    expect(caseAccessProvider.authorize).not.toHaveBeenCalled()
  })

  it('should throw DocumentFileNotFoundError when the file does not exist', async () => {
    documentBatchesRepository.findFileById.mockResolvedValue(undefined)

    await expect(
      useCase.execute({ fileId: 'missing-file', actorId: 'actor-1' }),
    ).rejects.toThrow(DocumentFileNotFoundError)
  })

  it('authorizes the persisted Case owner before returning file metadata', async () => {
    const ownerCaseId = 'case-1'
    documentValidationsRepository.findByFileId.mockResolvedValue(
      DocumentValidationDocumentFaker.fake({
        id: 'file-123',
        checklistLink: { caseId: ownerCaseId },
      }),
    )
    documentBatchesRepository.findFileById.mockResolvedValue({
      id: 'file-123',
      batchId: 'batch-456',
      storagePath: 'private/file.pdf',
      originalName: 'file.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1,
      createdAt: new Date(),
    })

    await useCase.execute({ fileId: 'file-123', actorId: 'collaborator-1' })

    expect(caseAccessProvider.authorize).toHaveBeenCalledWith({
      caseId: ownerCaseId,
      actorId: 'collaborator-1',
      intent: 'read_content',
    })
    expect(caseAccessProvider.authorize.mock.invocationCallOrder[0]).toBeLessThan(
      documentBatchesRepository.findFileById.mock.invocationCallOrder[0],
    )
  })
})
