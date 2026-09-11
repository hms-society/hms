import type {
  DatetimeProvider,
  FileStorageProvider,
  UseCase,
} from '../../shared/interfaces'
import type { FormalizationSignaturePreview } from '../domain/entities'
import type { DocumentPdfFreezeService } from '../../document-production/interfaces'
import {
  FormalizationSignatureDocumentVersionFileUnavailableError,
  FormalizationSignaturePreviewClaimConflictError,
} from '../domain/errors'
import type {
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

export class ProcessFormalizationSignaturePreviewUseCase
  implements UseCase<Request, Response>
{
  constructor(
    private readonly configurationRepository: FormalizationSignatureConfigurationRepository,
    private readonly sourceReader: FormalizationSignatureSourceReader,
    private readonly fileStorageProvider: FileStorageProvider,
    private readonly documentPdfFreezeService: DocumentPdfFreezeService,
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
      sourceDocument.documentVersionId !== document.documentVersionId ||
      !sourceDocument.documentSpecificationId
    ) {
      throw new FormalizationSignatureDocumentVersionFileUnavailableError()
    }

    const frozen = await this.documentPdfFreezeService.freeze({
      documentId: document.documentId,
      documentVersionId: document.documentVersionId,
      documentSpecificationId: sourceDocument.documentSpecificationId,
      traceId: request.traceId ?? request.previewId,
    })
    const storedPdf = await this.fileStorageProvider.get(frozen.pdfFileId)
    if (storedPdf?.file.contentType !== 'application/pdf') {
      throw new FormalizationSignatureDocumentVersionFileUnavailableError()
    }

    const file = await this.fileStorageProvider.save({
      filePath: `formalization/${request.formalizationId}/signature-previews/${document.documentId}/${document.documentVersionId}/${request.previewId}.pdf`,
      fileName: `formalization-${request.formalizationId}-${document.documentId}-${document.documentVersionId}-${request.previewId}.pdf`,
      contentType: 'application/pdf',
      sizeInBytes: storedPdf.content.byteLength,
      content: storedPdf.content.slice(),
    })
    const preview: FormalizationSignaturePreview = {
      id: request.previewId,
      formalizationId: request.formalizationId,
      documentId: document.documentId,
      documentVersionId: document.documentVersionId,
      fileId: file.id,
      contentChecksumSha256: frozen.sourceSha256,
      pdfChecksumSha256: frozen.pdfSha256,
      converterVersion: frozen.converterVersion,
      pageCount: frozen.pageCount,
      pages: frozen.pages,
      byteSize: frozen.byteSize,
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
