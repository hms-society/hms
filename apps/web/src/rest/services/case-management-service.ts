import type { CaseManagementService as CaseManagementRestService } from '@hms/core/case-management/interfaces'
import type {
  CaseChecklistItem,
  LegalCase,
  LegalCaseSummary,
} from '@hms/core/case-management/domain/entities'
import type { RestClient } from '@hms/core/shared/interfaces'

export const CaseManagementService = (
  restClient: RestClient,
): CaseManagementRestService => {
  return {
    addComplementaryChecklistItem(caseId, request) {
      return restClient.post<CaseChecklistItem>(
        `/cases/${caseId}/checklist/items`,
        request,
      )
    },

    listCaseChecklist(caseId) {
      return restClient.get<readonly CaseChecklistItem[]>(`/cases/${caseId}/checklist`)
    },

    listMyCases() {
      return restClient.get<readonly LegalCaseSummary[]>('/cases/my')
    },

    reviewChecklistGate(caseId, request) {
      return restClient.patch<LegalCase>(`/cases/${caseId}/checklist-gate`, request)
    },
  }
}
