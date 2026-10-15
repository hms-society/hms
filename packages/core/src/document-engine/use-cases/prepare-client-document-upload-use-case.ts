import type { ClientDocumentUpload } from '../domain/entities'
import { ConflictError } from '#shared/domain/errors/conflict-error'
import type { ClientDocumentUploadsRepository } from '../interfaces'
import type { PrepareChecklistUpload, ChecklistUploadTicket } from '../domain/structures'
import type { StorageProvider, DatetimeProvider, IdProvider } from '#shared/interfaces'
import { AppError } from '#shared/domain/errors/app-error'
export class PrepareClientDocumentUploadUseCase {
  constructor(
    private readonly uploads: ClientDocumentUploadsRepository,
    private readonly storage: StorageProvider,
    private readonly clock: DatetimeProvider,
    private readonly ids: IdProvider,
  ) {}
  async execute(request: PrepareChecklistUpload): Promise<ChecklistUploadTicket> {
    this.assertFileMetadata(request)
    let upload = await this.uploads.findByOperation(request)
    if (!upload) {
      const uploadId = this.ids.generate()
      const now = this.clock.now()
      upload = await this.uploads.add({
        ...request,
        id: uploadId,
        storagePath: `checklist-uploads/${uploadId}`,
        createdAt: now,
        expiresAt: now,
      })
    }
    this.assertSameOperation(upload, request)
    const metadata = await this.storage.inspect(upload.storagePath)
    if (metadata)
      return {
        uploadId: upload.id,
        alreadyUploaded: true,
        signedUrl: '',
        token: '',
        bucket: '',
        path: upload.storagePath,
        expiresAt: upload.expiresAt,
      }
    const ticket = await this.storage.createSignedUpload(upload.storagePath)
    await this.uploads.replace(upload.id, { expiresAt: ticket.expiresAt })
    return { ...ticket, uploadId: upload.id, alreadyUploaded: Boolean(metadata) }
  }
  private assertFileMetadata(request: PrepareChecklistUpload): void {
    if (
      !request.name.trim() ||
      request.name.length > 255 ||
      !['application/pdf', 'image/jpeg', 'image/png'].includes(request.mimeType) ||
      !Number.isInteger(request.sizeBytes) ||
      request.sizeBytes < 1 ||
      request.sizeBytes > 10 * 1024 * 1024
    )
      throw new AppError('Formato ou tamanho de arquivo inválido.', 'Arquivo Inválido')
  }
  private assertSameOperation(
    upload: ClientDocumentUpload,
    request: PrepareChecklistUpload,
  ): void {
    if (
      upload.clientId !== request.clientId ||
      upload.caseId !== request.caseId ||
      upload.checklistItemId !== request.checklistItemId ||
      upload.actorId !== request.actorId ||
      upload.name !== request.name ||
      upload.mimeType !== request.mimeType ||
      upload.sizeBytes !== request.sizeBytes
    )
      throw new ConflictError('A operação já foi usada para outro arquivo.')
  }
}
