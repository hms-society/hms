import type { CaseManagementService as CaseManagementRestService } from '@hms/core/case-management/interfaces'
import type {
  CaseChecklistItem,
  LegalCase,
  LegalCaseSummary,
} from '@hms/core/case-management/domain/entities'
import type { LegalCaseSummary as LegalCaseCompletionSummary } from '@hms/core/case-management/domain/structures'
import type { RestClient } from '@hms/core/shared/interfaces'
import { RestResponse } from '@hms/core/shared/responses/rest-response'

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

    listMyCases() {
      return restClient.get<readonly LegalCaseSummary[]>('/cases/my')
    },

    getLegalCaseDetails(caseId) {
      return restClient.get<LegalCaseSummary>(`/cases/${caseId}`)
    },

    reviewChecklistGate(caseId, request) {
      return restClient.patch<LegalCase>(`/cases/${caseId}/checklist-gate`, request)
    },

    async getByIntakeId(intakeId) {
      const response = await restClient.get<LegalCaseCompletionSummary | null>(
        `/cases/by-intake/${intakeId}`,
      )
      if (response.isFailure || response.body === null) return response
      const body = response.body

      return new RestResponse({
        body: { ...body, openedAt: new Date(body.openedAt) },
        statusCode: response.statusCode,
        headers: response.headers,
      })
    },
  }
}
