import type {
  DatetimeProvider,
  FileStorageProvider,
  IdProvider,
  UseCase,
} from '../../shared/interfaces'
import type { DocumentVersion, FrozenDocumentPdf } from '../domain/entities'
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

    const sourceFile = await this.dependencies.fileStorageProvider.get(version.fileId)
    if (!sourceFile || sourceFile.file.contentType !== DOCX_CONTENT_TYPE) {
      throw new DocumentVersionNotFreezableError('source_missing')
    }

    const sourceContent = sourceFile.content.slice()
    const sourceSha256 = await this.hash(sourceContent)
    let conversion: DocumentPdfConversionResult
    try {
      conversion = await this.dependencies.converter.convert({
        fileName: sourceFile.file.fileName,
        contentType: DOCX_CONTENT_TYPE,
        content: sourceContent.slice(),
        traceId: request.traceId,
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

    const pdfContent = conversion.content.slice()
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

    const now = this.dependencies.datetimeProvider.now()
    const pdfSha256 = await this.hash(pdfContent)
    const file = await this.dependencies.fileStorageProvider.save({
      filePath: `document-production/frozen-pdfs/${version.documentId}/${version.id}.pdf`,
      fileName: `${document.title}-${version.versionNumber}.pdf`,
      contentType: 'application/pdf',
      sizeInBytes: pdfContent.byteLength,
      content: pdfContent,
    })

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
