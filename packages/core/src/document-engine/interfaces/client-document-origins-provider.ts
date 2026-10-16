import type { ClientDocumentOrigin, ClientDocumentSource } from '../domain/structures'
export interface ClientDocumentOriginsProvider {
  list(request: {
    clientId: string
    actorId: string
    caseId: string
  }): Promise<readonly ClientDocumentOrigin[]>
  resolve(request: {
    clientId: string
    actorId: string
    caseId: string
    source: ClientDocumentSource
    forSelection: boolean
  }): Promise<ClientDocumentOrigin>
  read(request: {
    clientId: string
    actorId: string
    caseId: string
    source: ClientDocumentSource
  }): Promise<Uint8Array>
}
