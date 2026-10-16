import type { ClientDocument } from '../domain/entities/client-document'
import type {
  ConfirmReceivedClientDocumentReview,
  ChecklistUploadContext,
  ChecklistUploadTicket,
  PrepareChecklistUpload,
} from '../domain/structures'
export interface ClientDocumentsProvider {
  confirmReceivedReview(request: ConfirmReceivedClientDocumentReview): Promise<void>
  listAvailable(request: {
    clientId: string
    actorId: string
    caseId: string
  }): Promise<readonly ClientDocument[]>
  resolve(request: {
    clientId: string
    actorId: string
    caseId: string
    documentId: string
    forSelection: boolean
  }): Promise<ClientDocument>
  read(request: {
    clientId: string
    actorId: string
    caseId: string
    documentId: string
  }): Promise<{ document: ClientDocument; bytes: Uint8Array }>
  prepareUpload(request: PrepareChecklistUpload): Promise<ChecklistUploadTicket>
  completeUpload(
    request: ChecklistUploadContext & { uploadId: string },
  ): Promise<ClientDocument>
}
