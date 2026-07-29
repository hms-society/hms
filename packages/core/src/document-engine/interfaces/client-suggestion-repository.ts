import type { ClientSuggestion } from '../domain/entities'

export interface ClientSuggestionRepository {
  findById(clientSuggestionId: string): Promise<ClientSuggestion | undefined>
  findPendingByDocumentBatchId(
    documentBatchId: string,
  ): Promise<ClientSuggestion | undefined>
  save(clientSuggestion: ClientSuggestion): Promise<void>
}
