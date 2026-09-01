import type { RestClient } from '@hms/core/shared/interfaces'
import type {
  DocumentBatch,
  DocumentBatchFile,
} from '@hms/core/document-engine/domain/entities'
import type { PaginatedTriageBatches } from '@hms/core/document-engine/interfaces'

export const DocumentEngineService = (client: RestClient) => {
  return {
    listClientDocument: async (clientId: string) => {
      return client.get<DocumentBatch[]>(`/document-batches/clients/${clientId}`)
    },
    listTriageBatches: async (params?: { page?: number; limit?: number }) => {
      const searchParams = new URLSearchParams()
      if (params?.page) searchParams.set('page', String(params.page))
      if (params?.limit) searchParams.set('limit', String(params.limit))
      const query = searchParams.toString()
      const url = query ? `/document-batches/triage?${query}` : '/document-batches/triage'
      return client.get<PaginatedTriageBatches>(url)
    },
    getDocumentFile: async (fileId: string) => {
      return client.get<DocumentBatchFile>(`/documents/files/${fileId}`)
    },
  }
}
