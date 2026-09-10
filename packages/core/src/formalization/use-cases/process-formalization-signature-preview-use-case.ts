import type {
  DatetimeProvider,
  FileStorageProvider,
  UseCase,
} from '../../shared/interfaces'
import type { FormalizationSignaturePreview } from '../domain/entities'
import {
  FormalizationSignatureDocumentVersionFileUnavailableError,
  FormalizationSignaturePreviewClaimConflictError,
} from '../domain/errors'
import type {
  DocumentPdfConverter,
  FormalizationDocumentPdfInspector,
  FormalizationSignatureConfigurationRepository,
  FormalizationSignatureSourceReader,
} from '../interfaces'

type Request = {
  readonly formalizationId: string
  readonly previewId: string
  readonly attemptToken: string
  readonly traceId?: string
}

type Response = {
  readonly previewId: string
  readonly state: 'ready'
}

const DOCX_CONTENT_TYPE =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document' as const

export class ProcessFormalizationSignaturePreviewUseCase
  implements UseCase<Request, Response>
{
  constructor(
    private readonly configurationRepository: FormalizationSignatureConfigurationRepository,
    private readonly sourceReader: FormalizationSignatureSourceReader,
    private readonly fileStorageProvider: FileStorageProvider,
    private readonly documentPdfConverter: DocumentPdfConverter,
    private readonly documentPdfInspector: FormalizationDocumentPdfInspector,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

  async execute(request: Request): Promise<Response> {
    const configuration = await this.configurationRepository.findByFormalizationId(
      request.formalizationId,
    )

    const previewView = configuration?.documents
      .map(({ preview }) => preview)
      .find((item) => item?.previewId === request.previewId)
    if (!configuration || !previewView)
      throw new FormalizationSignaturePreviewClaimConflictError()
    const document = configuration.documents.find(
      ({ preview }) => preview?.previewId === request.previewId,
    )
    if (!document) throw new FormalizationSignaturePreviewClaimConflictError()

    const now = this.datetimeProvider.now()
    const leaseExpiresAt = new Date(now.getTime() + 5 * 60 * 1000)
    const claim = await this.configurationRepository.claimPreview({
      previewId: request.previewId,
      attemptToken: request.attemptToken,
      claimedAt: now,
      leaseExpiresAt,
    })
    if (!claim) throw new FormalizationSignaturePreviewClaimConflictError()

    const sourceDocument = await this.sourceReader.findDocumentVersion(
      request.formalizationId,
      document.documentVersionId,
    )
    if (
      !sourceDocument ||
      sourceDocument.documentId !== document.documentId ||
      sourceDocument.documentVersionId !== document.documentVersionId
    ) {
      throw new FormalizationSignatureDocumentVersionFileUnavailableError()
    }
    const storedSource = await this.fileStorageProvider.get(sourceDocument.fileId)
    if (!storedSource || storedSource.file.contentType !== DOCX_CONTENT_TYPE) {
      throw new FormalizationSignatureDocumentVersionFileUnavailableError()
    }

    const sourceContent = storedSource.content.slice()
    const conversion = await this.documentPdfConverter.convert({
      fileName: storedSource.file.fileName,
      contentType: DOCX_CONTENT_TYPE,
      content: sourceContent,
      traceId: request.traceId ?? request.previewId,
    })
    // pdfjs may transfer/detach the ArrayBuffer it receives. Keep the bytes
    // persisted and checksummed independent from the inspection lifecycle.
    const inspection = await this.documentPdfInspector.inspect(conversion.content.slice())
    const [contentChecksumSha256, pdfChecksumSha256] = await Promise.all([
      sha256(sourceContent),
      sha256(conversion.content),
    ])
    const fileName = `formalization-${request.formalizationId}-${document.documentId}-${document.documentVersionId}-${request.previewId}.pdf`
    const file = await this.fileStorageProvider.save({
      filePath: `formalization/${request.formalizationId}/signature-previews/${document.documentId}/${document.documentVersionId}/${request.previewId}.pdf`,
      fileName,
      contentType: conversion.contentType,
      sizeInBytes: conversion.content.byteLength,
      content: conversion.content,
    })

    const preview: FormalizationSignaturePreview = {
      id: request.previewId,
      formalizationId: request.formalizationId,
      documentId: document.documentId,
      documentVersionId: document.documentVersionId,
      fileId: file.id,
      contentChecksumSha256,
      pdfChecksumSha256,
      converterVersion: conversion.converterVersion,
      pageCount: inspection.pageCount,
      pages: inspection.pages,
      byteSize: conversion.content.byteLength,
      state: 'ready',
      attemptsCount: 1,
      createdAt: now,
      updatedAt: now,
    }
    const finalized = await this.configurationRepository.finalizePreview({
      preview,
      attemptToken: request.attemptToken,
      leaseExpiresAt: claim.leaseExpiresAt,
    })
    if (!finalized) {
      await this.fileStorageProvider.remove(file.id)
      throw new FormalizationSignaturePreviewClaimConflictError()
    }
    return { previewId: request.previewId, state: 'ready' }
  }
}

async function sha256(content: Uint8Array): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest(
    'SHA-256',
    Uint8Array.from(content),
  )
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')
}
