import type { CaseManagementService as CaseManagementRestService } from '@hms/core/case-management/interfaces'
import type { LegalCase } from '@hms/core/case-management/domain/entities'
import type { RestClient } from '@hms/core/shared/interfaces'

export const CaseManagementService = (
  restClient: RestClient,
): CaseManagementRestService => {
  return {
    reviewChecklistGate(caseId, request) {
      return restClient.patch<LegalCase>(`/cases/${caseId}/checklist-gate`, request)
    },
  }
}
