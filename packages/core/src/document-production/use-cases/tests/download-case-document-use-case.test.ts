import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import type { StorageProvider } from '../../../shared/interfaces/storage-provider'
import { DocumentFaker, DocumentVersionFaker } from '../../domain/entities/fakers'
import type { GetCaseDocumentUseCase } from '../get-case-document-use-case'
import { DownloadCaseDocumentUseCase } from '../download-case-document-use-case'
import { NotFoundError } from '../../../shared/domain/errors/not-found-error'

describe('Download Case Document Use Case', () => {
  let getCaseDocument: MockProxy<GetCaseDocumentUseCase>
  let storage: MockProxy<StorageProvider>
  let useCase: DownloadCaseDocumentUseCase

  beforeEach(() => {
    getCaseDocument = mock<GetCaseDocumentUseCase>()
    storage = mock<StorageProvider>()
    useCase = new DownloadCaseDocumentUseCase(getCaseDocument, storage)
  })

  it('downloads the highest numbered version only after authorized document lookup', async () => {
    const document = DocumentFaker.fake({ id: 'document-1', title: 'Mandato' })
    const older = DocumentVersionFaker.fake({
      documentId: document.id,
      versionNumber: 1,
      storagePath: 'cases/mandato-v1.docx',
    })
    const newest = DocumentVersionFaker.fake({
      documentId: document.id,
      versionNumber: 2,
      storagePath: 'cases/mandato-v2.pdf',
    })
    getCaseDocument.execute.mockResolvedValue({
      document,
      versions: [older, newest],
    })
    storage.download.mockResolvedValue(new Uint8Array([1, 2]))

    const result = await useCase.execute({
      caseId: 'case-1',
      documentId: document.id,
      actorId: 'collaborator-1',
    })

    expect(getCaseDocument.execute).toHaveBeenCalledWith({
      caseId: 'case-1',
      documentId: document.id,
      actorId: 'collaborator-1',
    })
    expect(storage.download).toHaveBeenCalledWith('cases/mandato-v2.pdf')
    expect(storage.download.mock.invocationCallOrder[0]).toBeGreaterThan(
      getCaseDocument.execute.mock.invocationCallOrder[0],
    )
    expect(result).toEqual({
      content: new Uint8Array([1, 2]),
      mimeType: 'application/pdf',
    })
  })

  it('downloads the selected version and rejects an unrelated version identifier', async () => {
    const document = DocumentFaker.fake({ id: 'document-1' })
    const older = DocumentVersionFaker.fake({
      id: 'older',
      documentId: document.id,
      versionNumber: 1,
      storagePath: 'cases/older.docx',
    })
    const newest = DocumentVersionFaker.fake({
      id: 'newest',
      documentId: document.id,
      versionNumber: 2,
      storagePath: 'cases/newest.pdf',
    })
    getCaseDocument.execute.mockResolvedValue({ document, versions: [older, newest] })
    storage.download.mockResolvedValue(new Uint8Array([1]))
    const request = {
      caseId: 'case-1',
      documentId: document.id,
      actorId: 'collaborator-1',
    }
    await useCase.execute({ ...request, versionId: older.id })
    expect(storage.download).toHaveBeenCalledExactlyOnceWith('cases/older.docx')
    storage.download.mockClear()
    await expect(useCase.execute({ ...request, versionId: 'unrelated' })).rejects.toThrow(
      NotFoundError,
    )
    expect(storage.download).not.toHaveBeenCalled()
  })

  it('uses the Word MIME type for a stored DOCX version', async () => {
    const document = DocumentFaker.fake({ id: 'document-1', title: 'Mandato' })
    const version = DocumentVersionFaker.fake({
      documentId: document.id,
      versionNumber: 1,
      storagePath: 'cases/mandato.docx',
    })
    getCaseDocument.execute.mockResolvedValue({ document, versions: [version] })
    storage.download.mockResolvedValue(new Uint8Array([3]))

    const result = await useCase.execute({
      caseId: 'case-1',
      documentId: document.id,
      actorId: 'collaborator-1',
    })

    expect(result.mimeType).toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    )
    expect(storage.download).toHaveBeenCalledWith('cases/mandato.docx')
  })

  it('fails when the latest version does not have a storage path', async () => {
    const document = DocumentFaker.fake({ id: 'document-1', title: 'Mandato' })
    const version = DocumentVersionFaker.fake({
      documentId: document.id,
      versionNumber: 1,
      storagePath: undefined,
    })
    getCaseDocument.execute.mockResolvedValue({ document, versions: [version] })

    await expect(
      useCase.execute({
        caseId: 'case-1',
        documentId: document.id,
        actorId: 'collaborator-1',
      }),
    ).rejects.toThrow(NotFoundError)
    expect(storage.download).not.toHaveBeenCalled()
  })
})
