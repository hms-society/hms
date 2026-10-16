import type { RestResponse } from '#shared/responses/rest-response'
import type { CaseHistoryEntry } from '../domain/entities'
import type { CaseHistoryPage, CaseHistoryQuery } from '../domain/structures'
import type { ClientDocument } from '../../document-engine/domain/entities'
export interface CaseHistoryService {
  listCaseHistory(
    caseId: string,
    query: Omit<CaseHistoryQuery, 'caseId' | 'actorId'>,
  ): Promise<RestResponse<CaseHistoryPage>>
  registerCaseUpdate(
    caseId: string,
    request: {
      operationId: string
      occurredAt: string
      description: string
      documentIds: readonly string[]
    },
  ): Promise<RestResponse<CaseHistoryEntry>>
  listCaseHistoryDocuments(
    caseId: string,
  ): Promise<RestResponse<readonly ClientDocument[]>>
  readCaseHistoryDocument(
    caseId: string,
    entryId: string,
    documentId: string,
  ): Promise<RestResponse<Blob>>
}
