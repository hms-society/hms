import type { ClientDocumentUpload } from '../domain/entities/client-document-upload'
import type { ChecklistUploadContext } from '../domain/structures/checklist-upload-context'
export interface ClientDocumentUploadsRepository {
  findById(uploadId: string): Promise<ClientDocumentUpload | undefined>
  findByStoragePath(storagePath: string): Promise<ClientDocumentUpload | undefined>
  findByOperation(
    request: ChecklistUploadContext & { operationId: string },
  ): Promise<ClientDocumentUpload | undefined>
  add(upload: ClientDocumentUpload): Promise<ClientDocumentUpload>
  replace(
    uploadId: string,
    changes: { expiresAt?: Date; clientDocumentId?: string; processingAcceptedAt?: Date },
  ): Promise<void>
}
