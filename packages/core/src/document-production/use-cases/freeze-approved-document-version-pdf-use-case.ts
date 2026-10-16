import type { File } from '../../shared/domain/entities'
import type { StoredFileContent } from '../../shared/domain/structures'
import type {
  DatetimeProvider,
  FileStorageProvider,
  IdProvider,
  UseCase,
} from '../../shared/interfaces'
import type { Document, DocumentVersion, FrozenDocumentPdf } from '../domain/entities'
import type {
  DocumentPdfInspection,
  DocumentPdfConversionResult,
} from '../domain/structures'
import {
  DocumentPdfConversionError,
  DocumentPdfInspectionError,
  DocumentVersionNotFreezableError,
} from '../domain/errors'
import type {
  DocumentPdfConverter,
  DocumentPdfInspector,
  DocumentSpecificationsRepository,
  DocumentVersionsRepository,
  DocumentsRepository,
  FrozenDocumentPdfsRepository,
} from '../interfaces'

type Request = {
  readonly documentId: string
  readonly documentVersionId: string
  readonly documentSpecificationId: string
  readonly traceId: string
}

type Dependencies = {
  readonly documentsRepository: DocumentsRepository
  readonly versionsRepository: DocumentVersionsRepository
  readonly specificationsRepository: DocumentSpecificationsRepository
  readonly frozenPdfsRepository: FrozenDocumentPdfsRepository
  readonly fileStorageProvider: FileStorageProvider
  readonly converter: DocumentPdfConverter
  readonly inspector: DocumentPdfInspector
  readonly datetimeProvider: DatetimeProvider
  readonly idProvider: IdProvider
}

const DOCX_CONTENT_TYPE =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document' as const

export class FreezeApprovedDocumentVersionPdfUseCase
  implements UseCase<Request, FrozenDocumentPdf>
{
  constructor(private readonly dependencies: Dependencies) {}

  async execute(request: Request): Promise<FrozenDocumentPdf> {
    const existing = await this.dependencies.frozenPdfsRepository.findByDocumentVersionId(
      request.documentVersionId,
    )
    if (existing) return existing

    const { document, version } = await this.loadApprovedVersion(request)
    const sourceFile = await this.loadSourceFile(version)
    const sourceContent = sourceFile.content.slice()
    const sourceSha256 = await this.hash(sourceContent)
    const conversion = await this.convertSource(
      { ...sourceFile, content: sourceContent },
      request.traceId,
    )
    const pdfContent = conversion.content.slice()
    const inspection = await this.inspectPdf(pdfContent)
    const now = this.dependencies.datetimeProvider.now()
    const pdfSha256 = await this.hash(pdfContent)
    const file = await this.savePdf(document, version, pdfContent)
    return this.persistFrozen(
      request,
      document,
      version,
      file,
      sourceSha256,
      pdfSha256,
      conversion,
      inspection,
      pdfContent,
      now,
    )
  }

  private async loadApprovedVersion(request: Request) {
    const document = await this.dependencies.documentsRepository.findById(
      request.documentId,
    )
    const version = await this.dependencies.versionsRepository.findById(
      request.documentVersionId,
    )
    const specification = await this.dependencies.specificationsRepository.findById(
      request.documentSpecificationId,
    )

    if (!document || !version || !specification || version.documentId !== document.id) {
      throw new DocumentVersionNotFreezableError('not_found')
    }
    this.assertCurrentApproved(version, document.currentVersionId)

    return { document, version }
  }
  private async loadSourceFile(version: DocumentVersion): Promise<StoredFileContent> {
    const sourceFile = await this.dependencies.fileStorageProvider.get(version.fileId)
    if (!sourceFile || sourceFile.file.contentType !== DOCX_CONTENT_TYPE) {
      throw new DocumentVersionNotFreezableError('source_missing')
    }

    return sourceFile
  }
  private async convertSource(
    sourceFile: StoredFileContent,
    traceId: string,
  ): Promise<DocumentPdfConversionResult> {
    const sourceContent = sourceFile.content.slice()
    let conversion: DocumentPdfConversionResult
    try {
      conversion = await this.dependencies.converter.convert({
        fileName: sourceFile.file.fileName,
        contentType: DOCX_CONTENT_TYPE,
        content: sourceContent.slice(),
        traceId: traceId,
      })
    } catch (error) {
      if (error instanceof DocumentPdfConversionError) throw error
      throw new DocumentPdfConversionError(
        error instanceof Error ? error.message : undefined,
      )
    }

    if (
      conversion.contentType !== 'application/pdf' ||
      conversion.content.byteLength === 0 ||
      !conversion.converterVersion.trim()
    ) {
      throw new DocumentPdfConversionError('O conversor retornou um PDF inválido.', false)
    }

    return conversion
  }
  private async inspectPdf(pdfContent: Uint8Array): Promise<DocumentPdfInspection> {
    let inspection: DocumentPdfInspection
    try {
      inspection = await this.dependencies.inspector.inspect(pdfContent.slice())
    } catch (error) {
      if (error instanceof DocumentPdfInspectionError) throw error
      throw new DocumentPdfInspectionError(
        error instanceof Error ? error.message : undefined,
      )
    }
    this.assertInspection(inspection.pageCount, inspection.pages.length)

    return inspection
  }
  private async savePdf(
    document: Document,
    version: DocumentVersion,
    pdfContent: Uint8Array,
  ): Promise<File> {
    const file = await this.dependencies.fileStorageProvider.save({
      filePath: `document-production/frozen-pdfs/${version.documentId}/${version.id}/${this.dependencies.idProvider.generate()}.pdf`,
      fileName: `${document.title}-${version.versionNumber}.pdf`,
      contentType: 'application/pdf',
      sizeInBytes: pdfContent.byteLength,
      content: pdfContent,
    })

    return file
  }
  private async persistFrozen(
    request: Request,
    document: Document,
    version: DocumentVersion,
    file: File,
    sourceSha256: string,
    pdfSha256: string,
    conversion: DocumentPdfConversionResult,
    inspection: DocumentPdfInspection,
    pdfContent: Uint8Array,
    now: Date,
  ): Promise<FrozenDocumentPdf> {
    let frozen: FrozenDocumentPdf | undefined
    try {
      frozen = await this.dependencies.frozenPdfsRepository.add({
        documentId: document.id,
        documentVersionId: version.id,
        documentVersionNumber: version.versionNumber,
        documentSpecificationId: request.documentSpecificationId,
        ...(version.sourceDocumentVersionId
          ? { sourceDocumentVersionId: version.sourceDocumentVersionId }
          : {}),
        source: version.source,
        sourceFileId: version.fileId,
        pdfFileId: file.id,
        sourceSha256,
        pdfSha256,
        converterVersion: conversion.converterVersion,
        pageCount: inspection.pageCount,
        pages: inspection.pages,
        byteSize: pdfContent.byteLength,
        approvedByCollaboratorId: version.reviewedByCollaboratorId as string,
        approvedAt: version.reviewedAt as Date,
        frozenAt: now,
      })
    } catch (error) {
      await this.dependencies.fileStorageProvider.remove(file.id)
      throw error
    }

    if (frozen) return frozen

    await this.dependencies.fileStorageProvider.remove(file.id)
    const racedArtifact =
      await this.dependencies.frozenPdfsRepository.findByDocumentVersionId(version.id)
    if (racedArtifact) return racedArtifact
    throw new DocumentVersionNotFreezableError('stale')
  }

  private assertCurrentApproved(
    version: DocumentVersion,
    currentVersionId?: string,
  ): void {
    if (currentVersionId !== version.id)
      throw new DocumentVersionNotFreezableError('stale')
    if (version.status !== 'approved')
      throw new DocumentVersionNotFreezableError('unapproved')
    if (!version.reviewedByCollaboratorId || !version.reviewedAt) {
      throw new DocumentVersionNotFreezableError('unapproved')
    }
  }

  private assertInspection(pageCount: number, pagesCount: number): void {
    if (!Number.isInteger(pageCount) || pageCount < 1 || pagesCount !== pageCount) {
      throw new DocumentPdfInspectionError()
    }
  }

  private async hash(content: Uint8Array): Promise<string> {
    const digest = await globalThis.crypto.subtle.digest(
      'SHA-256',
      content as unknown as BufferSource,
    )
    return Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, '0'),
    ).join('')
  }
}
