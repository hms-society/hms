import type { RestClient } from '@hms/core/shared/interfaces'
import type {
  DocumentBatch,
  DocumentBatchFile,
} from '@hms/core/document-engine/domain/entities'

export const DocumentEngineService = (client: RestClient) => {
  return {
    listClientDocument: async (clientId: string) => {
      return client.get<DocumentBatch[]>(`/document-batches/clients/${clientId}`)
    },
    listTriageBatches: async () => {
      return client.get<DocumentBatch[]>('/document-batches/triage')
    },
    getDocumentFile: async (fileId: string) => {
      return client.get<DocumentBatchFile>(`/documents/files/${fileId}`)
    },
  }
}
