import type { RestClient } from '@hms/core/shared/interfaces'
import type { RestResponse } from '@hms/core/shared/responses/rest-response'
import type { DocumentTemplateContent } from '@hms/core/document-production/domain/structures'

export type CaseDocumentResponse = {
  id: string
  title: string
  currentVersionId?: string
  versions: Array<{
    id: string
    versionNumber: number
    source: 'ai' | 'manual'
    status: string
    createdAt: string
    createdByCollaboratorId: string
    reviewedAt?: string
    rejectionReason?: string
    content?: DocumentTemplateContent
    storagePath?: string
    pendingVariables: Array<{
      marker: string
      technicalName: string
      label: string
    }>
  }>
  generation?: {
    id: string
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
    failureMessage?: string
    completedAt?: string
    failedAt?: string
    referenceDocuments?: Array<{
      id: string
      fileName: string
      checklistItemLabel?: string
    }>
  }
}

export type CaseDocumentGenerationContext = {
  case: { id: string; publicCode: string; title: string }
  models: Array<{ id: string; name: string; description: string }>
  documents: Array<{
    id: string
    checklistItemId: string
    label: string
    fileName: string
    validationStatus: string
    reviewedAt: string
    reviewedBy: string
  }>
  checklistGateDecision?: string
  canGenerate: boolean
}

export type GenerateCaseDocumentRequest = {
  documentSpecificationId: string
  documentFileIds: string[]
  instructions?: string
}

export type CaseDocumentGenerationResponse = {
  documentGenerationId: string
  documentId: string
}

export const CaseDocumentProductionService = (restClient: RestClient) => ({
  getGenerationContext(
    caseId: string,
  ): Promise<RestResponse<CaseDocumentGenerationContext>> {
    return restClient.get(`/cases/${caseId}/document-generation-context`)
  },
  generateDocument(
    caseId: string,
    request: GenerateCaseDocumentRequest,
  ): Promise<RestResponse<CaseDocumentGenerationResponse>> {
    return restClient.post(`/cases/${caseId}/documents/generations`, request)
  },
  retryGeneration(
    caseId: string,
    documentId: string,
  ): Promise<RestResponse<CaseDocumentGenerationResponse>> {
    return restClient.post(
      `/cases/${caseId}/documents/${documentId}/generations/retry`,
      {},
    )
  },
  listDocuments(caseId: string): Promise<RestResponse<CaseDocumentResponse[]>> {
    return restClient.get(`/cases/${caseId}/documents`)
  },
  getDocument(
    caseId: string,
    documentId: string,
  ): Promise<RestResponse<CaseDocumentResponse>> {
    return restClient.get(`/cases/${caseId}/documents/${documentId}`)
  },
  saveEditedContent(
    caseId: string,
    documentId: string,
    versionId: string,
    content: DocumentTemplateContent,
  ): Promise<RestResponse<{ savedAt: string; versionId: string }>> {
    return restClient.patch(
      `/cases/${caseId}/documents/${documentId}/versions/${versionId}`,
      content,
    )
  },
  getDocumentFile(caseId: string, documentId: string): Promise<RestResponse<Blob>> {
    return restClient.getFile(`/cases/${caseId}/documents/${documentId}/file`)
  },
})
