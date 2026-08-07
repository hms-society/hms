import type { RestClient } from '@hms/core/shared/interfaces'
import type { DocumentBatch, DocumentBatchFile } from '@hms/core/documents/domain/entities'

export const documentService = (client: RestClient) => {
  return {
    listClientDocument: async (clientId: string) => {
      return client.get<DocumentBatch[]>(`/document-batches/clients/${clientId}`)
    },
    getDocumentFile: async (fileId: string) => {
      return client.get<DocumentBatchFile>(`/documents/files/${fileId}`)
    }
  }
}