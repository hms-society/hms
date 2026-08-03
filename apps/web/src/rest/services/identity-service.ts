import type { IdentityService as IdentityRestService } from '@hms/core/identity/interfaces'
import type {
  ClientConsent,
  ClientDetails,
  CollaboratorSummary,
} from '@hms/core/identity/domain/entities'
import type { ConsentType } from '@hms/core/identity/domain/structures'
import type { CollaboratorListQuery } from '@hms/core/identity/domain/structures'
import type { CollaboratorUpdate } from '@hms/core/identity/domain/entities'
import type { RestClient } from '@hms/core/shared/interfaces'
import type { PaginationResponse } from '@hms/core/shared/responses/pagination-response'

function createCollaboratorsPath(query: CollaboratorListQuery) {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) searchParams.set(key, String(value))
  }

  const queryString = searchParams.toString()

  return queryString ? `/collaborators?${queryString}` : '/collaborators'
}

export const IdentityService = (restClient: RestClient): IdentityRestService => {
  return {
    getClient(clientId) {
      return restClient.get<ClientDetails>(`/clients/${clientId}`)
    },

    lookupClient(request) {
      return restClient.post<ClientDetails>('/clients/lookup', request)
    },

    registerClient(request) {
      return restClient.post<ClientDetails>('/clients', request)
    },

    grantClientConsent(clientId: string, type: ConsentType) {
      return restClient.post<ClientConsent>(`/clients/${clientId}/consents`, { type })
    },

    listClients(params) {
      const searchParams = new URLSearchParams()
      searchParams.append('page', params.page.toString())
      searchParams.append('limit', params.limit.toString())

      if (params.search) {
        searchParams.append('search', params.search)
      }

      return restClient.get<{
        data: unknown[]
        total: number
        page: number
        limit: number
      }>(`/clients?${searchParams.toString()}`)
    },

    listCollaborators(query) {
      return restClient.get<PaginationResponse<CollaboratorSummary>>(
        createCollaboratorsPath(query),
      )
    },

    getCollaborator(collaboratorId) {
      return restClient.get<CollaboratorSummary>(`/collaborators/${collaboratorId}`)
    },

    listCollaboratorJobTitles() {
      return restClient.get<readonly string[]>('/collaborators/job-titles')
    },

    getCurrentCollaborator() {
      return restClient.get<CollaboratorSummary>('/collaborators/me')
    },

    registerCollaborator(request) {
      return restClient.post<CollaboratorSummary>('/collaborators', request)
    },

    updateCollaborator(collaboratorId, changes: CollaboratorUpdate) {
      return restClient.patch<CollaboratorSummary>(
        `/collaborators/${collaboratorId}`,
        changes,
      )
    },

    resendCollaboratorInvitation(collaboratorId) {
      return restClient.post<CollaboratorSummary>(
        `/collaborators/${collaboratorId}/invitation/resend`,
        {},
      )
    },

    deactivateCollaborator(collaboratorId) {
      return restClient.post<CollaboratorSummary>(
        `/collaborators/${collaboratorId}/deactivate`,
        {},
      )
    },

    reactivateCollaborator(collaboratorId) {
      return restClient.post<CollaboratorSummary>(
        `/collaborators/${collaboratorId}/reactivate`,
        {},
      )
    },

    cancelCollaboratorInvitation(collaboratorId) {
      return restClient.post<CollaboratorSummary>(
        `/collaborators/${collaboratorId}/invitation/cancel`,
        {},
      )
    },

    removeCollaborator(collaboratorId) {
      return restClient.delete<void>(`/collaborators/${collaboratorId}`)
    },

    completeSignIn() {
      return restClient.post<CollaboratorSummary>('/auth/complete-sign-in')
    },
  }
}
