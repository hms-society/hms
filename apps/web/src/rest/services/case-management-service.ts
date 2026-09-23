import type { CaseManagementService as CaseManagementRestService } from '@hms/core/case-management/interfaces'
import type {
  CaseChecklistItem,
  ChecklistTemplate,
  LegalCase,
  LegalCaseSummary,
  Pending,
  AssistedMessage,
} from '@hms/core/case-management/domain/entities'
import type {
  GrantCasePortalAccessResponse,
  PortalDocumentUploadResponse,
} from '@hms/core/case-management/interfaces'
import type { RestClient } from '@hms/core/shared/interfaces'

export const CaseManagementService = (
  restClient: RestClient,
): CaseManagementRestService => {
  return {
    createLegalCase(request) {
      return restClient.post<LegalCase>('/cases', request)
    },

    listCasePendings(caseId) {
      return restClient.get<readonly Pending[]>(`/cases/${caseId}/pendencies`)
    },

    getPendingMessage(pendingId) {
      return restClient.get<AssistedMessage>(`/cases/pendencies/${pendingId}/message`)
    },

    editPendingMessage(pendingId, request) {
      return restClient.patch<AssistedMessage>(
        `/cases/pendencies/${pendingId}/message`,
        request,
      )
    },

    approvePendingMessage(pendingId) {
      return restClient.post<AssistedMessage>(
        `/cases/pendencies/${pendingId}/message/approve`,
        {},
      )
    },

    createPending(caseId, request) {
      return restClient.post<Pending>(`/cases/${caseId}/pendencies`, request)
    },

    addComplementaryChecklistItem(caseId, request) {
      return restClient.post<CaseChecklistItem>(
        `/cases/${caseId}/checklist/items`,
        request,
      )
    },

    listCaseChecklist(caseId, clientId) {
      const query = clientId ? `?clientId=${encodeURIComponent(clientId)}` : ''
      return restClient.get<readonly CaseChecklistItem[]>(
        `/cases/${caseId}/checklist${query}`,
      )
    },

    listChecklistTemplates() {
      return restClient.get<readonly ChecklistTemplate[]>('/cases/checklist-templates')
    },

    listMyCases(clientId) {
      const query = clientId ? `?clientId=${encodeURIComponent(clientId)}` : ''
      return restClient.get<readonly LegalCaseSummary[]>(`/cases/my${query}`)
    },

    replaceChecklistTemplate(request) {
      return restClient.put<ChecklistTemplate>('/cases/checklist-templates', request)
    },

    getLegalCaseDetails(caseId) {
      return restClient.get<LegalCaseSummary>(`/cases/${caseId}`)
    },

    grantCasePortalAccess(caseId, request) {
      return restClient.post<GrantCasePortalAccessResponse>(
        `/cases/${caseId}/portal-access`,
        request,
      )
    },

    reviewChecklistGate(caseId, request) {
      return restClient.patch<LegalCase>(`/cases/${caseId}/checklist-gate`, request)
    },

    listPortalPendingChecklist(caseId, portalToken) {
      const query = new URLSearchParams({ portalToken })
      return restClient.get<readonly CaseChecklistItem[]>(
        `/cases/${caseId}/portal-pendencies?${query.toString()}`,
      )
    },

    uploadPortalDocument(caseId, checklistItemId, portalToken, file) {
      const query = new URLSearchParams({ portalToken })
      return restClient.postFormData<PortalDocumentUploadResponse>(
        `/cases/${caseId}/portal-pendencies/${checklistItemId}/upload?${query.toString()}`,
        file as FormData,
      )
    },
  }
}
