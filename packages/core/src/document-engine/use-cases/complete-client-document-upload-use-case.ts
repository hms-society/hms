import {
  DocumentBatchStatus,
  DocumentBatchChannel,
  DocumentValidationStatus,
} from '../domain/structures'
import { ConflictError } from '#shared/domain/errors/conflict-error'
import type {
  ClientDocumentsRepository,
  ClientDocumentUploadsRepository,
  DocumentBatchesRepository,
  ClientDocumentReceiptTransactionProvider,
} from '../interfaces'
import type { ChecklistUploadContext } from '../domain/structures'
import type {
  ClientDocument,
  ClientDocumentUpload,
  DocumentBatchFile,
} from '../domain/entities'
import type { StorageProvider } from '#shared/interfaces'
import type { CollaboratorsRepository } from '#identity/interfaces'
import { BadRequestError } from '#shared/domain/errors/bad-request-error'
export class CompleteClientDocumentUploadUseCase {
  constructor(
    private readonly uploads: ClientDocumentUploadsRepository,
    private readonly documents: ClientDocumentsRepository,
    private readonly batches: DocumentBatchesRepository,
    private readonly storage: StorageProvider,
    private readonly collaborators: CollaboratorsRepository,
    private readonly transaction: ClientDocumentReceiptTransactionProvider,
  ) {}
  async execute(
    request: ChecklistUploadContext & { uploadId: string },
  ): Promise<ClientDocument> {
    const document = await this.transaction.runInTransaction(() =>
      this.confirmReceipt(request),
    )
    if (document.source.kind === 'received_file') {
      const file = await this.batches.findFileById(document.source.fileId)
      if (!file) throw new ConflictError('Recebimento indisponível.')
    }
    return document
  }
  private async confirmReceipt(
    request: ChecklistUploadContext & { uploadId: string },
  ): Promise<ClientDocument> {
    const upload = await this.requireBoundUpload(request)
    if (upload.clientDocumentId) {
      const document = await this.documents.findById(upload.clientDocumentId)
      if (!document) throw new ConflictError('Recebimento indisponível.')
      return document
    }
    await this.verifyOriginal(upload)
    const file = await this.receiveOriginal(upload)
    const document = await this.reconcileOriginal(upload, file)
    await this.uploads.replace(upload.id, { clientDocumentId: document.id })
    return document
  }
  private async requireBoundUpload(
    request: ChecklistUploadContext & { uploadId: string },
  ): Promise<ClientDocumentUpload> {
    const upload = await this.uploads.findById(request.uploadId)
    if (
      !upload ||
      upload.clientId !== request.clientId ||
      upload.caseId !== request.caseId ||
      upload.checklistItemId !== request.checklistItemId ||
      upload.actorId !== request.actorId
    )
      throw new ConflictError('Envio indisponível para este item.')
    return upload
  }
  private async verifyOriginal(upload: ClientDocumentUpload): Promise<void> {
    const metadata = await this.storage.inspect(upload.storagePath)
    if (
      !metadata ||
      metadata.mimeType !== upload.mimeType ||
      metadata.sizeBytes !== upload.sizeBytes
    )
      throw new BadRequestError('O arquivo enviado não corresponde ao envio preparado.')
    const bytes = await this.storage.download(upload.storagePath)
    if (
      bytes.byteLength !== upload.sizeBytes ||
      !this.matchesMagic(bytes, upload.mimeType)
    )
      throw new BadRequestError('O conteúdo do arquivo é inválido.')
  }
  private async receiveOriginal(
    upload: ClientDocumentUpload,
  ): Promise<DocumentBatchFile> {
    const actor = await this.collaborators.findById(upload.actorId)
    if (!actor) throw new ConflictError('Autor do envio indisponível.')
    const batch = await this.batches.add({
      readableId: `CHECKLIST-${upload.id}`,
      status: DocumentBatchStatus.Identified,
      channel: DocumentBatchChannel.InternalUpload,
      sender: upload.actorId,
      inTriageBox: false,
      createdBy: actor.userId,
      files: [
        {
          storagePath: upload.storagePath,
          originalName: upload.name,
          mimeType: upload.mimeType,
          sizeBytes: upload.sizeBytes,
          status: DocumentValidationStatus.AwaitingValidation,
          caseId: upload.caseId,
          checklistItemId: upload.checklistItemId,
        },
      ],
    })
    const file = batch.files?.[0]
    if (!file) throw new ConflictError('Recebimento incompleto.')
    return file
  }
  private async reconcileOriginal(
    upload: ClientDocumentUpload,
    file: DocumentBatchFile,
  ): Promise<ClientDocument> {
    const document = await this.documents.add({
      sourceKey: JSON.stringify(['received_file', file.id]),
      origin: {
        clientId: upload.clientId,
        name: file.originalName,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
        createdAt: file.createdAt,
        source: { kind: 'received_file', fileId: file.id },
      },
    })
    return document
  }
  private matchesMagic(bytes: Uint8Array, mimeType: string): boolean {
    if (mimeType === 'application/pdf')
      return bytes.length >= 5 && String.fromCharCode(...bytes.slice(0, 5)) === '%PDF-'
    if (mimeType === 'image/jpeg')
      return bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
    return (
      bytes.length >= 8 &&
      [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value)
    )
  }
}
