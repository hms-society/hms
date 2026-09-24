import type { RestClient } from '@hms/core/shared/interfaces'
import type { RestResponse } from '@hms/core/shared/responses/rest-response'
import type { DocumentTemplateContent } from '@hms/core/document-production/domain/structures'

export type CaseDocumentResponse = {
  id: string
  title: string
  currentVersionId?: string
  versions: Array<{ id: string; versionNumber: number; source: 'ai' | 'manual'; status: string; createdAt: string; createdByCollaboratorId: string; reviewedAt?: string; rejectionReason?: string; content?: DocumentTemplateContent; storagePath?: string }>
}

export const CaseDocumentProductionService = (restClient: RestClient) => ({
  listDocuments(caseId: string): Promise<RestResponse<CaseDocumentResponse[]>> {
    return restClient.get(`/cases/${caseId}/documents`)
  },
  getDocument(caseId: string, documentId: string): Promise<RestResponse<CaseDocumentResponse>> {
    return restClient.get(`/cases/${caseId}/documents/${documentId}`)
  },
  getDocumentFile(caseId: string, documentId: string): Promise<RestResponse<Blob>> {
    return restClient.getFile(`/cases/${caseId}/documents/${documentId}/file`)
  },
})
