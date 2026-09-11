import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import { DocumentFaker, DocumentSpecificationFaker, DocumentVersionFaker } from '../../domain/entities/fakers'
import type {
  DocumentPdfConverter,
  DocumentPdfInspector,
  DocumentSpecificationsRepository,
  DocumentVersionsRepository,
  DocumentsRepository,
  FrozenDocumentPdfsRepository,
} from '../../interfaces'
import type { DatetimeProvider, FileStorageProvider, IdProvider } from '../../../shared/interfaces'
import { FreezeApprovedDocumentVersionPdfUseCase } from '../freeze-approved-document-version-pdf-use-case'
import {
  DocumentVersionNotFreezableError,
  DocumentPdfInspectionError,
} from '../../domain/errors'

describe('Freeze Approved Document Version Pdf Use Case', () => {
  function setup() {
    const documentsRepository = mock<DocumentsRepository>()
    const versionsRepository = mock<DocumentVersionsRepository>()
    const specificationsRepository = mock<DocumentSpecificationsRepository>()
    const frozenPdfsRepository = mock<FrozenDocumentPdfsRepository>()
    const fileStorageProvider = mock<FileStorageProvider>()
    const converter = mock<DocumentPdfConverter>()
    const inspector = mock<DocumentPdfInspector>()
    const datetimeProvider = mock<DatetimeProvider>()
    const idProvider = mock<IdProvider>()
    const useCase = new FreezeApprovedDocumentVersionPdfUseCase({
      documentsRepository, versionsRepository, specificationsRepository, frozenPdfsRepository,
      fileStorageProvider, converter, inspector, datetimeProvider, idProvider,
    })
    return {
      useCase, documentsRepository, versionsRepository, specificationsRepository,
      frozenPdfsRepository, fileStorageProvider, converter, inspector, datetimeProvider,
    }
  }

  it('freezes an approved current version with hashes and geometry', async () => {
    const setupState = setup()
    const document = DocumentFaker.fake({ id: 'document-1', title: 'Contrato', currentVersionId: 'version-1' })
    const version = DocumentVersionFaker.fake({
      id: 'version-1', documentId: document.id, fileId: 'docx-1', versionNumber: 2,
      status: 'approved', reviewedByCollaboratorId: 'reviewer',
      reviewedAt: new Date('2026-08-31T10:00:00.000Z'),
    })
    const specification = DocumentSpecificationFaker.fake({ id: 'specification-1' })
    const now = new Date('2026-09-01T10:00:00.000Z')
    setupState.documentsRepository.findById.mockResolvedValue(document)
    setupState.versionsRepository.findById.mockResolvedValue(version)
    setupState.specificationsRepository.findById.mockResolvedValue(specification)
    setupState.fileStorageProvider.get.mockResolvedValue({
      file: { id: 'docx-1', filePath: 'docx', fileName: 'contract.docx', contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', sizeInBytes: 3, createdAt: now },
      content: new Uint8Array([1, 2, 3]),
    })
    setupState.converter.convert.mockResolvedValue({ contentType: 'application/pdf', content: new Uint8Array([1, 2, 3, 4]), converterVersion: 'converter-1' })
    setupState.inspector.inspect.mockResolvedValue({ pageCount: 1, pages: [{ page: 1, width: 612, height: 792 }] })
    setupState.datetimeProvider.now.mockReturnValue(now)
    setupState.fileStorageProvider.save.mockResolvedValue({ id: 'pdf-1', filePath: 'pdf', fileName: 'Contract-2.pdf', contentType: 'application/pdf', sizeInBytes: 4, createdAt: now })
    setupState.frozenPdfsRepository.add.mockImplementation(async (creation) => ({ ...creation, id: 'frozen-1', createdAt: now }))

    await expect(setupState.useCase.execute({ documentId: document.id, documentVersionId: version.id, documentSpecificationId: specification.id, traceId: 'trace-1' }))
      .resolves.toMatchObject({ documentVersionId: version.id, pdfFileId: 'pdf-1', pageCount: 1, byteSize: 4, sourceSha256: expect.stringMatching(/^[a-f0-9]{64}$/), pdfSha256: expect.stringMatching(/^[a-f0-9]{64}$/) })
  })

  it('reuses an existing artifact and rejects stale, unapproved or invalid PDFs', async () => {
    const state = setup()
    const existing = { id: 'frozen', documentId: 'd', documentVersionId: 'v', documentVersionNumber: 1, documentSpecificationId: 's', source: 'ai' as const, sourceFileId: 'source', pdfFileId: 'pdf', sourceSha256: 'a'.repeat(64), pdfSha256: 'b'.repeat(64), converterVersion: 'v1', pageCount: 1, pages: [{ page: 1, width: 1, height: 1 }], byteSize: 1, approvedByCollaboratorId: 'reviewer', approvedAt: new Date(), frozenAt: new Date(), createdAt: new Date() }
    state.frozenPdfsRepository.findByDocumentVersionId.mockResolvedValue(existing)
    await expect(state.useCase.execute({ documentId: 'd', documentVersionId: 'v', documentSpecificationId: 's', traceId: 'trace' })).resolves.toBe(existing)
    state.frozenPdfsRepository.findByDocumentVersionId.mockResolvedValue(undefined)
    const document = DocumentFaker.fake({ id: 'd', currentVersionId: 'other' })
    const version = DocumentVersionFaker.fake({ id: 'v', documentId: 'd', status: 'approved' })
    state.documentsRepository.findById.mockResolvedValue(document)
    state.versionsRepository.findById.mockResolvedValue(version)
    state.specificationsRepository.findById.mockResolvedValue(DocumentSpecificationFaker.fake({ id: 's' }))
    await expect(state.useCase.execute({ documentId: 'd', documentVersionId: 'v', documentSpecificationId: 's', traceId: 'trace' })).rejects.toBeInstanceOf(DocumentVersionNotFreezableError)
    state.documentsRepository.findById.mockResolvedValue({ ...document, currentVersionId: 'v' })
    state.versionsRepository.findById.mockResolvedValue({ ...version, status: 'approved', reviewedAt: new Date(), reviewedByCollaboratorId: 'reviewer' })
    state.fileStorageProvider.get.mockResolvedValue({ file: { id: 'source', filePath: 'source', fileName: 'source.docx', contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', sizeInBytes: 1, createdAt: new Date() }, content: new Uint8Array([1]) })
    state.converter.convert.mockResolvedValue({ contentType: 'application/pdf', content: new Uint8Array([1]), converterVersion: 'v1' })
    state.inspector.inspect.mockRejectedValue(new DocumentPdfInspectionError())
    await expect(state.useCase.execute({ documentId: 'd', documentVersionId: 'v', documentSpecificationId: 's', traceId: 'trace' })).rejects.toBeInstanceOf(DocumentPdfInspectionError)
  })

  it('removes the saved PDF when canonical artifact persistence throws', async () => {
    const state = setup()
    const document = DocumentFaker.fake({ id: 'd', title: 'Contrato', currentVersionId: 'v' })
    const version = DocumentVersionFaker.fake({
      id: 'v',
      documentId: 'd',
      fileId: 'docx-1',
      status: 'approved',
      reviewedByCollaboratorId: 'reviewer',
      reviewedAt: new Date('2026-08-31T10:00:00.000Z'),
    })
    const specification = DocumentSpecificationFaker.fake({ id: 's' })
    const now = new Date('2026-09-01T10:00:00.000Z')
    const persistenceError = new Error('repository unavailable')
    state.documentsRepository.findById.mockResolvedValue(document)
    state.versionsRepository.findById.mockResolvedValue(version)
    state.specificationsRepository.findById.mockResolvedValue(specification)
    state.fileStorageProvider.get.mockResolvedValue({
      file: {
        id: 'docx-1',
        filePath: 'source',
        fileName: 'source.docx',
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        sizeInBytes: 1,
        createdAt: now,
      },
      content: new Uint8Array([1]),
    })
    state.converter.convert.mockResolvedValue({
      contentType: 'application/pdf',
      content: new Uint8Array([2]),
      converterVersion: 'v1',
    })
    state.inspector.inspect.mockResolvedValue({
      pageCount: 1,
      pages: [{ page: 1, width: 612, height: 792 }],
    })
    state.datetimeProvider.now.mockReturnValue(now)
    state.fileStorageProvider.save.mockResolvedValue({
      id: 'pdf-1',
      filePath: 'pdf',
      fileName: 'Contrato-1.pdf',
      contentType: 'application/pdf',
      sizeInBytes: 1,
      createdAt: now,
    })
    state.frozenPdfsRepository.add.mockRejectedValue(persistenceError)

    await expect(
      state.useCase.execute({
        documentId: document.id,
        documentVersionId: version.id,
        documentSpecificationId: specification.id,
        traceId: 'trace',
      }),
    ).rejects.toBe(persistenceError)
    expect(state.fileStorageProvider.remove).toHaveBeenCalledWith('pdf-1')
  })
})
