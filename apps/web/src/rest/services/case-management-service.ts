import type { CaseManagementService as CaseManagementRestService } from '@hms/core/case-management/interfaces'
import type {
  CaseChecklistItem,
  ChecklistTemplate,
  LegalCase,
  LegalCaseSummary,
  Pending,
  AssistedMessage,
} from '@hms/core/case-management/domain/entities'
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

    reviewChecklistGate(caseId, request) {
      return restClient.patch<LegalCase>(`/cases/${caseId}/checklist-gate`, request)
    },

    homologateDossier(caseId) {
      return restClient.patch<LegalCase>(`/cases/${caseId}/dossier-gate/homologation`, {})
    },
  }
}
