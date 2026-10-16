import { DocumentBatchStatus, DocumentValidationStatus } from '../domain/structures'
import { CaseAccessIntent } from '../../case-management/domain/structures'
import type { DocumentBatchFile } from '../domain/entities'
import type {
  DocumentBatchesRepository,
  ClientDocumentUploadsRepository,
} from '../interfaces'
import type {
  CaseAccessProvider,
  LegalCasesRepository,
} from '../../case-management/interfaces'
import type { ClientDocumentOrigin } from '../domain/structures'
import { NotFoundError } from '#shared/domain/errors/not-found-error'
export class ResolveReceivedClientDocumentUseCase {
  constructor(
    private readonly batches: DocumentBatchesRepository,
    private readonly access: CaseAccessProvider,
    private readonly cases: LegalCasesRepository,
    private readonly uploads: ClientDocumentUploadsRepository,
  ) {}
  async execute(request: {
    clientId: string
    actorId: string
    caseId: string
    fileId: string
    forSelection?: boolean
  }): Promise<ClientDocumentOrigin> {
    await this.access.authorize({
      caseId: request.caseId,
      actorId: request.actorId,
      intent: CaseAccessIntent.ReadDocument,
    })
    const target = await this.cases.findById(request.caseId)
    if (target?.clientId !== request.clientId)
      throw new NotFoundError('Documento indisponível.')
    const file = await this.requireConfirmedOriginal(request)
    if (file.caseId && file.caseId !== request.caseId)
      await this.access.authorize({
        caseId: file.caseId,
        actorId: request.actorId,
        intent: CaseAccessIntent.ReadDocument,
      })
    return {
      clientId: request.clientId,
      name: file.originalName,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      createdAt: file.createdAt,
      source: { kind: 'received_file', fileId: file.id },
    }
  }
  private async requireConfirmedOriginal(request: {
    clientId: string
    caseId: string
    fileId: string
    forSelection?: boolean
  }): Promise<DocumentBatchFile> {
    const batches = await this.batches.findById(
      request.clientId,
      request.forSelection === false,
    )
    const batch = batches.find((batch) =>
      batch.files?.some((file) => file.id === request.fileId),
    )
    const file = batch?.files?.find((file) => file.id === request.fileId)
    if (!file && request.forSelection === false) return this.requirePrivateUpload(request)
    if (
      !batch ||
      !file ||
      batch.clientId !== request.clientId ||
      batch.inTriageBox !== false ||
      !new Set<string>([
        DocumentBatchStatus.Linked,
        DocumentBatchStatus.Identified,
        DocumentBatchStatus.Processed,
        DocumentBatchStatus.WithError,
        DocumentBatchStatus.PendingHumanReview,
        DocumentBatchStatus.TriageCompleted,
        DocumentBatchStatus.AutomaticTriageInProgress,
      ]).has(batch.status) ||
      (request.forSelection !== false &&
        file.status === DocumentValidationStatus.Duplicate)
    )
      throw new NotFoundError('Documento indisponível.')
    return file
  }

  private async requirePrivateUpload(request: {
    clientId: string
    caseId: string
    fileId: string
  }): Promise<DocumentBatchFile> {
    const file = await this.batches.findFileById(request.fileId)
    const upload = file
      ? await this.uploads.findByStoragePath(file.storagePath)
      : undefined
    if (
      !file ||
      !upload?.clientDocumentId ||
      upload.publishedAt ||
      upload.clientId !== request.clientId ||
      upload.caseId !== request.caseId ||
      file.caseId !== upload.caseId ||
      file.checklistItemId !== upload.checklistItemId
    )
      throw new NotFoundError('Documento indisponível.')
    return file
  }
}
