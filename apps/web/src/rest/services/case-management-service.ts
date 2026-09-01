import type { CaseManagementService as CaseManagementRestService } from '@hms/core/case-management/interfaces'
import type {
  LegalCase,
  LegalCaseSummary,
} from '@hms/core/case-management/domain/entities'
import type { RestClient } from '@hms/core/shared/interfaces'

export const CaseManagementService = (
  restClient: RestClient,
): CaseManagementRestService => {
  return {
    completeChecklist(caseId) {
      return restClient.patch<LegalCase>(`/cases/${caseId}/checklist-completion`)
    },

    listMyCases() {
      return restClient.get<readonly LegalCaseSummary[]>('/cases/my')
    },

    reviewChecklistGate(caseId, request) {
      return restClient.patch<LegalCase>(`/cases/${caseId}/checklist-gate`, request)
    },
  }
}
