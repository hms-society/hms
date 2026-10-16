import type { ClientDocument } from '../domain/entities/client-document'
import type { ClientDocumentOrigin } from '../domain/structures/client-document-origin'
export interface ClientDocumentsRepository {
  findById(documentId: string): Promise<ClientDocument | undefined>
  listByClientId(clientId: string): Promise<readonly ClientDocument[]>
  add(request: {
    sourceKey: string
    origin: ClientDocumentOrigin
  }): Promise<ClientDocument>
}
