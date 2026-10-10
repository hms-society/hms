import type { CaseTeamManagementService as CaseManagementRestService } from '@hms/core/case-management/interfaces'
import type {
  CaseChecklistItem,
  ChecklistTemplate,
  LegalCase,
  LegalCaseSummary,
  CaseTask,
  Pending,
  AssistedMessage,
} from '@hms/core/case-management/domain/entities'
import type {
  CaseEligibleCollaborator,
  CaseTeam,
  CaseTeamMutationResult,
} from '@hms/core/case-management/domain/structures'
import type { CaseTeamHistory } from '@hms/core/case-management/domain/entities'
import type {
  CasePortalAccessSummary,
  GrantCasePortalAccessResponse,
  PortalDocumentUploadResponse,
  ThirdPartyPortalCaseResponse,
} from '@hms/core/case-management/interfaces'
import type { RestClient } from '@hms/core/shared/interfaces'
import type { PaginationResponse } from '@hms/core/shared/responses/pagination-response'

export const CaseManagementService = (
  restClient: RestClient,
): CaseManagementRestService => {
  return {
    listCaseTasks(caseId) {
      return restClient.get<readonly CaseTask[]>(`/cases/${caseId}/tasks`)
    },

    createCaseTask(caseId, request) {
      return restClient.post<CaseTask>(`/cases/${caseId}/tasks`, request)
    },

    updateCaseTask(caseId, taskId, request) {
      return restClient.patch<CaseTask>(`/cases/${caseId}/tasks/${taskId}`, request)
    },

    deleteCaseTask(caseId, taskId, request) {
      return restClient.delete<CaseTask>(`/cases/${caseId}/tasks/${taskId}`, request)
    },

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

    getCaseTeam(caseId) {
      return restClient.get<CaseTeam>(`/cases/${caseId}/team`)
    },

    listCaseTeamCandidates(query, caseId) {
      const params = new URLSearchParams({
        page: String(query.page),
        pageSize: String(query.pageSize),
      })
      if (query.search) params.set('search', query.search)
      if (query.profile) params.set('profile', query.profile)
      if (caseId) params.set('caseId', caseId)
      return restClient.get<PaginationResponse<CaseEligibleCollaborator>>(
        `/cases/team-candidates?${params}`,
      )
    },

    addCaseTeamMember(caseId, request) {
      return restClient.post<CaseTeamMutationResult>(`/cases/${caseId}/team`, request)
    },

    changeCaseTeamMemberRole(caseId, membershipId, request) {
      return restClient.patch<CaseTeamMutationResult>(
        `/cases/${caseId}/team/${membershipId}/role`,
        request,
      )
    },

    removeCaseTeamMember(caseId, membershipId, request) {
      return restClient.delete<CaseTeamMutationResult>(
        `/cases/${caseId}/team/${membershipId}`,
        request,
      )
    },

    listCaseTeamHistory(caseId, page, pageSize) {
      return restClient.get<PaginationResponse<CaseTeamHistory>>(
        `/cases/${caseId}/team/history?page=${page}&pageSize=${pageSize}`,
      )
    },

    grantCasePortalAccess(caseId, request) {
      return restClient.post<GrantCasePortalAccessResponse>(
        `/cases/${caseId}/portal-access`,
        request,
      )
    },

    listCasePortalAccess(caseId) {
      return restClient.get<readonly CasePortalAccessSummary[]>(
        `/cases/${caseId}/portal-access`,
      )
    },

    reviewChecklistGate(caseId, request) {
      return restClient.patch<LegalCase>(`/cases/${caseId}/checklist-gate`, request)
    },

    homologateDossier(caseId) {
      return restClient.patch<LegalCase>(`/cases/${caseId}/dossier-gate/homologation`, {})
    },

    listPortalPendingChecklist(caseId, portalToken) {
      const query = new URLSearchParams({ portalToken })
      return restClient.get<readonly CaseChecklistItem[]>(
        `/cases/${caseId}/portal-pendencies?${query.toString()}`,
      )
    },

    getThirdPartyPortalCase(caseId, portalToken) {
      const query = new URLSearchParams({ portalToken })
      return restClient.get<ThirdPartyPortalCaseResponse>(
        `/third-party-portal/cases/${caseId}?${query.toString()}`,
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
