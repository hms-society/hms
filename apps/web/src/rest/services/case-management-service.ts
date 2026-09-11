import type { CaseManagementService as CaseManagementRestService } from '@hms/core/case-management/interfaces'
import type {
  CaseChecklistItem,
  ChecklistTemplate,
  LegalCase,
  LegalCaseSummary,
} from '@hms/core/case-management/domain/entities'
import type { RestClient } from '@hms/core/shared/interfaces'

export const CaseManagementService = (
  restClient: RestClient,
): CaseManagementRestService => {
  return {
    createLegalCase(request) {
      return restClient.post<LegalCase>('/cases', request)
    },

    addComplementaryChecklistItem(caseId, request) {
      return restClient.post<CaseChecklistItem>(
        `/cases/${caseId}/checklist/items`,
        request,
      )
    },

    listCaseChecklist(caseId) {
      return restClient.get<readonly CaseChecklistItem[]>(`/cases/${caseId}/checklist`)
    },

    listChecklistTemplates() {
      return restClient.get<readonly ChecklistTemplate[]>('/cases/checklist-templates')
    },

    listMyCases() {
      return restClient.get<readonly LegalCaseSummary[]>('/cases/my')
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
  }
}
