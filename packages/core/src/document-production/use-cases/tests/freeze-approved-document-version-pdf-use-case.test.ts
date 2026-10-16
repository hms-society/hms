import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import {
  DocumentFaker,
  DocumentSpecificationFaker,
  DocumentVersionFaker,
} from '../../domain/entities/fakers'
import type {
  DocumentPdfConverter,
  DocumentPdfInspector,
  DocumentSpecificationsRepository,
  DocumentVersionsRepository,
  DocumentsRepository,
  FrozenDocumentPdfsRepository,
} from '../../interfaces'
import type {
  DatetimeProvider,
  FileStorageProvider,
  IdProvider,
} from '../../../shared/interfaces'
import { FreezeApprovedDocumentVersionPdfUseCase } from '../freeze-approved-document-version-pdf-use-case'
import {
  DocumentVersionNotFreezableError,
  DocumentPdfInspectionError,
  DocumentPdfConversionError,
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
      documentsRepository,
      versionsRepository,
      specificationsRepository,
      frozenPdfsRepository,
      fileStorageProvider,
      converter,
      inspector,
      datetimeProvider,
      idProvider,
    })
    return {
      useCase,
      documentsRepository,
      versionsRepository,
      specificationsRepository,
      frozenPdfsRepository,
      fileStorageProvider,
      converter,
      inspector,
      datetimeProvider,
      idProvider,
    }
  }
  it('preserves the winning PDF bytes when concurrent freezes clean up the losing artifact', async () => {
    const state = ready()
    const objects = new Map<string, Uint8Array>()
    const paths = new Map<string, string>()
    let savedCount = 0
    let generatedCount = 0
    let winner: Awaited<
      ReturnType<FrozenDocumentPdfsRepository['findByDocumentVersionId']>
    >
    state.idProvider.generate.mockImplementation(() => `attempt-${++generatedCount}`)
    state.frozenPdfsRepository.findByDocumentVersionId.mockImplementation(
      async () => winner,
    )
    state.fileStorageProvider.save.mockImplementation(async (input) => {
      const id = `saved-${++savedCount}`
      objects.set(input.filePath, input.content.slice())
      paths.set(id, input.filePath)
      return { ...input, id, createdAt: new Date('2026-10-12T00:00:00.000Z') }
    })
    state.fileStorageProvider.remove.mockImplementation(async (id) => {
      objects.delete(paths.get(id) as string)
      paths.delete(id)
    })
    state.frozenPdfsRepository.add.mockImplementation(async (creation) => {
      if (winner) return undefined
      winner = {
        ...creation,
        id: 'winning-artifact',
        createdAt: new Date('2026-10-12T00:00:00.000Z'),
      }
      return winner
    })
    const results = await Promise.all([
      state.useCase.execute(state.request),
      state.useCase.execute(state.request),
    ])
    expect(results[0]).toEqual(results[1])
    expect(state.fileStorageProvider.save).toHaveBeenCalledTimes(2)
    expect(state.fileStorageProvider.remove).toHaveBeenCalledTimes(1)
    const winningPath = paths.get(results[0].pdfFileId)
    expect(winningPath).toBeDefined()
    expect(objects.get(winningPath as string)).toEqual(new Uint8Array([2]))
    expect(
      new Set(state.fileStorageProvider.save.mock.calls.map(([input]) => input.filePath))
        .size,
    ).toBe(2)
    expect(await state.useCase.execute(state.request)).toEqual(results[0])
    expect(state.fileStorageProvider.save).toHaveBeenCalledTimes(2)
  })

  it('freezes an approved current version with hashes and geometry', async () => {
    const setupState = setup()
    const document = DocumentFaker.fake({
      id: 'document-1',
      title: 'Contrato',
      currentVersionId: 'version-1',
    })
    const version = DocumentVersionFaker.fake({
      id: 'version-1',
      documentId: document.id,
      fileId: 'docx-1',
      versionNumber: 2,
      status: 'approved',
      reviewedByCollaboratorId: 'reviewer',
      reviewedAt: new Date('2026-08-31T10:00:00.000Z'),
    })
    const specification = DocumentSpecificationFaker.fake({ id: 'specification-1' })
    const now = new Date('2026-09-01T10:00:00.000Z')
    setupState.documentsRepository.findById.mockResolvedValue(document)
    setupState.versionsRepository.findById.mockResolvedValue(version)
    setupState.specificationsRepository.findById.mockResolvedValue(specification)
    setupState.fileStorageProvider.get.mockResolvedValue({
      file: {
        id: 'docx-1',
        filePath: 'docx',
        fileName: 'contract.docx',
        contentType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        sizeInBytes: 3,
        createdAt: now,
      },
      content: new Uint8Array([1, 2, 3]),
    })
    setupState.converter.convert.mockResolvedValue({
      contentType: 'application/pdf',
      content: new Uint8Array([1, 2, 3, 4]),
      converterVersion: 'converter-1',
    })
    setupState.inspector.inspect.mockResolvedValue({
      pageCount: 1,
      pages: [{ page: 1, width: 612, height: 792 }],
    })
    setupState.datetimeProvider.now.mockReturnValue(now)
    setupState.fileStorageProvider.save.mockResolvedValue({
      id: 'pdf-1',
      filePath: 'pdf',
      fileName: 'Contract-2.pdf',
      contentType: 'application/pdf',
      sizeInBytes: 4,
      createdAt: now,
    })
    setupState.frozenPdfsRepository.add.mockImplementation(async (creation) => ({
      ...creation,
      id: 'frozen-1',
      createdAt: now,
    }))

    await expect(
      setupState.useCase.execute({
        documentId: document.id,
        documentVersionId: version.id,
        documentSpecificationId: specification.id,
        traceId: 'trace-1',
      }),
    ).resolves.toMatchObject({
      documentVersionId: version.id,
      pdfFileId: 'pdf-1',
      pageCount: 1,
      byteSize: 4,
      sourceSha256: expect.stringMatching(/^[a-f0-9]{64}$/),
      pdfSha256: expect.stringMatching(/^[a-f0-9]{64}$/),
    })
  })

  it('reuses an existing artifact and rejects stale, unapproved or invalid PDFs', async () => {
    const state = setup()
    const existing = {
      id: 'frozen',
      documentId: 'd',
      documentVersionId: 'v',
      documentVersionNumber: 1,
      documentSpecificationId: 's',
      source: 'ai' as const,
      sourceFileId: 'source',
      pdfFileId: 'pdf',
      sourceSha256: 'a'.repeat(64),
      pdfSha256: 'b'.repeat(64),
      converterVersion: 'v1',
      pageCount: 1,
      pages: [{ page: 1, width: 1, height: 1 }],
      byteSize: 1,
      approvedByCollaboratorId: 'reviewer',
      approvedAt: new Date(),
      frozenAt: new Date(),
      createdAt: new Date(),
    }
    state.frozenPdfsRepository.findByDocumentVersionId.mockResolvedValue(existing)
    await expect(
      state.useCase.execute({
        documentId: 'd',
        documentVersionId: 'v',
        documentSpecificationId: 's',
        traceId: 'trace',
      }),
    ).resolves.toBe(existing)
    state.frozenPdfsRepository.findByDocumentVersionId.mockResolvedValue(undefined)
    const document = DocumentFaker.fake({ id: 'd', currentVersionId: 'other' })
    const version = DocumentVersionFaker.fake({
      id: 'v',
      documentId: 'd',
      status: 'approved',
    })
    state.documentsRepository.findById.mockResolvedValue(document)
    state.versionsRepository.findById.mockResolvedValue(version)
    state.specificationsRepository.findById.mockResolvedValue(
      DocumentSpecificationFaker.fake({ id: 's' }),
    )
    await expect(
      state.useCase.execute({
        documentId: 'd',
        documentVersionId: 'v',
        documentSpecificationId: 's',
        traceId: 'trace',
      }),
    ).rejects.toBeInstanceOf(DocumentVersionNotFreezableError)
    state.documentsRepository.findById.mockResolvedValue({
      ...document,
      currentVersionId: 'v',
    })
    state.versionsRepository.findById.mockResolvedValue({
      ...version,
      status: 'approved',
      reviewedAt: new Date(),
      reviewedByCollaboratorId: 'reviewer',
    })
    state.fileStorageProvider.get.mockResolvedValue({
      file: {
        id: 'source',
        filePath: 'source',
        fileName: 'source.docx',
        contentType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        sizeInBytes: 1,
        createdAt: new Date(),
      },
      content: new Uint8Array([1]),
    })
    state.converter.convert.mockResolvedValue({
      contentType: 'application/pdf',
      content: new Uint8Array([1]),
      converterVersion: 'v1',
    })
    state.inspector.inspect.mockRejectedValue(new DocumentPdfInspectionError())
    await expect(
      state.useCase.execute({
        documentId: 'd',
        documentVersionId: 'v',
        documentSpecificationId: 's',
        traceId: 'trace',
      }),
    ).rejects.toBeInstanceOf(DocumentPdfInspectionError)
  })

  it('removes the saved PDF when canonical artifact persistence throws', async () => {
    const state = setup()
    const document = DocumentFaker.fake({
      id: 'd',
      title: 'Contrato',
      currentVersionId: 'v',
    })
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
        contentType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
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
  function ready() {
    const state = setup()
    const now = new Date('2026-10-12T12:00:00Z')
    const document = DocumentFaker.fake({ id: 'document', currentVersionId: 'version' })
    const version = DocumentVersionFaker.fake({
      id: 'version',
      documentId: document.id,
      status: 'approved',
      reviewedAt: now,
      reviewedByCollaboratorId: 'reviewer',
      sourceDocumentVersionId: 'previous-version',
    })
    state.documentsRepository.findById.mockResolvedValue(document)
    state.versionsRepository.findById.mockResolvedValue(version)
    state.specificationsRepository.findById.mockResolvedValue(
      DocumentSpecificationFaker.fake({ id: 'specification' }),
    )
    state.fileStorageProvider.get.mockResolvedValue({
      file: {
        id: version.fileId,
        filePath: 'source',
        fileName: 'source.docx',
        contentType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        sizeInBytes: 1,
        createdAt: now,
      },
      content: new Uint8Array([1]),
    })
    state.converter.convert.mockResolvedValue({
      contentType: 'application/pdf',
      content: new Uint8Array([2]),
      converterVersion: 'converter',
    })
    state.inspector.inspect.mockResolvedValue({
      pageCount: 1,
      pages: [{ page: 1, width: 612, height: 792 }],
    })
    state.datetimeProvider.now.mockReturnValue(now)
    state.fileStorageProvider.save.mockResolvedValue({
      id: 'saved-pdf',
      filePath: 'pdf',
      fileName: 'source.pdf',
      contentType: 'application/pdf',
      sizeInBytes: 1,
      createdAt: now,
    })
    const request = {
      documentId: document.id,
      documentVersionId: version.id,
      documentSpecificationId: 'specification',
      traceId: 'trace',
    }
    return { ...state, request, version }
  }
  it.each([
    'missing-document',
    'missing-version',
    'missing-specification',
    'wrong-document',
    'unapproved',
    'missing-reviewer',
    'missing-reviewed-time',
    'missing-source',
    'wrong-source-type',
  ])('rejects %s without producing an artifact', async (scenario) => {
    const state = ready()
    if (scenario === 'missing-document')
      state.documentsRepository.findById.mockResolvedValue(undefined)
    if (scenario === 'missing-version')
      state.versionsRepository.findById.mockResolvedValue(undefined)
    if (scenario === 'missing-specification')
      state.specificationsRepository.findById.mockResolvedValue(undefined)
    if (scenario === 'wrong-document')
      state.versionsRepository.findById.mockResolvedValue({
        ...state.version,
        documentId: 'other',
      })
    if (scenario === 'unapproved')
      state.versionsRepository.findById.mockResolvedValue({
        ...state.version,
        status: 'in_review',
      })
    if (scenario === 'missing-reviewer')
      state.versionsRepository.findById.mockResolvedValue({
        ...state.version,
        reviewedByCollaboratorId: undefined,
      })
    if (scenario === 'missing-reviewed-time')
      state.versionsRepository.findById.mockResolvedValue({
        ...state.version,
        reviewedAt: undefined,
      })
    if (scenario === 'missing-source')
      state.fileStorageProvider.get.mockResolvedValue(null)
    if (scenario === 'wrong-source-type') {
      const original = await state.fileStorageProvider.get(state.version.fileId)
      if (!original) throw new Error('Expected source fixture')
      state.fileStorageProvider.get.mockResolvedValue({
        ...original,
        file: { ...original.file, contentType: 'application/pdf' },
      })
    }
    await expect(state.useCase.execute(state.request)).rejects.toBeInstanceOf(
      DocumentVersionNotFreezableError,
    )
    expect(state.fileStorageProvider.save).not.toHaveBeenCalled()
  })
  it.each([
    'exception',
    'typed-exception',
    'non-error',
    'wrong-type',
    'empty-content',
    'missing-converter',
  ])('rejects %s conversion without saving PDF', async (scenario) => {
    const state = ready()
    if (scenario === 'exception')
      state.converter.convert.mockRejectedValue(new Error('conversion failed'))
    if (scenario === 'typed-exception')
      state.converter.convert.mockRejectedValue(new DocumentPdfConversionError())
    if (scenario === 'non-error') state.converter.convert.mockRejectedValue('failed')
    if (scenario === 'wrong-type')
      state.converter.convert.mockResolvedValue({
        contentType: 'text/plain' as 'application/pdf',
        content: new Uint8Array([2]),
        converterVersion: 'converter',
      })
    if (scenario === 'empty-content')
      state.converter.convert.mockResolvedValue({
        contentType: 'application/pdf',
        content: new Uint8Array(),
        converterVersion: 'converter',
      })
    if (scenario === 'missing-converter')
      state.converter.convert.mockResolvedValue({
        contentType: 'application/pdf',
        content: new Uint8Array([2]),
        converterVersion: ' ',
      })
    await expect(state.useCase.execute(state.request)).rejects.toBeInstanceOf(
      DocumentPdfConversionError,
    )
    expect(state.fileStorageProvider.save).not.toHaveBeenCalled()
  })
  it.each([
    'exception',
    'non-error',
    'fractional-pages',
    'zero-pages',
    'mismatched-pages',
  ])('rejects %s inspection without saving PDF', async (scenario) => {
    const state = ready()
    if (scenario === 'exception')
      state.inspector.inspect.mockRejectedValue(new Error('inspection failed'))
    if (scenario === 'non-error')
      state.inspector.inspect.mockRejectedValue('inspection failed')
    if (scenario === 'fractional-pages')
      state.inspector.inspect.mockResolvedValue({ pageCount: 1.5, pages: [] })
    if (scenario === 'zero-pages')
      state.inspector.inspect.mockResolvedValue({ pageCount: 0, pages: [] })
    if (scenario === 'mismatched-pages')
      state.inspector.inspect.mockResolvedValue({
        pageCount: 2,
        pages: [{ page: 1, width: 612, height: 792 }],
      })
    await expect(state.useCase.execute(state.request)).rejects.toBeInstanceOf(
      DocumentPdfInspectionError,
    )
    expect(state.fileStorageProvider.save).not.toHaveBeenCalled()
  })
  it.each([
    true,
    false,
  ])('removes losing PDF and resolves persistence race with existing artifact %s', async (hasWinner) => {
    const state = ready()
    state.frozenPdfsRepository.add.mockResolvedValue(undefined)
    const winner = { id: 'winning-artifact' } as Awaited<
      ReturnType<FrozenDocumentPdfsRepository['add']>
    >
    state.frozenPdfsRepository.findByDocumentVersionId
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(hasWinner ? winner : undefined)
    const result = state.useCase.execute(state.request)
    if (hasWinner) await expect(result).resolves.toBe(winner)
    else await expect(result).rejects.toBeInstanceOf(DocumentVersionNotFreezableError)
    expect(state.fileStorageProvider.remove).toHaveBeenCalledWith('saved-pdf')
    expect(state.frozenPdfsRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({ sourceDocumentVersionId: 'previous-version' }),
    )
  })
})
