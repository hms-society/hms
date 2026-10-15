import type {
  ClientConsent,
  ClientDetails,
  CollaboratorSummary,
  ThirdParty,
} from '@hms/core/identity/domain/entities'
import type { CollaboratorUpdate } from '@hms/core/identity/domain/entities'
import type { CollaboratorProfessionalProfile } from '@hms/core/identity/domain/structures'
import type {
  ConsentType,
  CollaboratorListQuery,
} from '@hms/core/identity/domain/structures'
import type { ThirdPartyRegistration } from '@hms/core/identity/interfaces'
import type { IdentityService as IdentityRestService } from '@hms/core/identity/interfaces'
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

function createThirdPartyService(
  restClient: RestClient,
): Pick<
  IdentityRestService,
  | 'listThirdParties'
  | 'registerThirdParty'
  | 'updateThirdParty'
  | 'deactivateThirdParty'
  | 'reactivateThirdParty'
> {
  return {
    listThirdParties: () => restClient.get<readonly ThirdParty[]>('/third-parties'),
    registerThirdParty: (request: ThirdPartyRegistration) =>
      restClient.post<ThirdParty>('/third-parties', request),
    updateThirdParty: (thirdPartyId, changes) =>
      restClient.patch<ThirdParty>(`/third-parties/${thirdPartyId}`, changes),
    deactivateThirdParty: (thirdPartyId) =>
      restClient.patch<ThirdParty>(`/third-parties/${thirdPartyId}/deactivate`, {}),
    reactivateThirdParty: (thirdPartyId) =>
      restClient.patch<ThirdParty>(`/third-parties/${thirdPartyId}/reactivate`, {}),
  }
}

function createClientService(
  restClient: RestClient,
): Pick<
  IdentityRestService,
  | 'getClient'
  | 'lookupClient'
  | 'registerClient'
  | 'grantClientConsent'
  | 'updateClient'
  | 'listClients'
> {
  return {
    getClient: (clientId) => restClient.get<ClientDetails>(`/clients/${clientId}`),
    lookupClient: (request) => restClient.post<ClientDetails>('/clients/lookup', request),
    registerClient: (request) => restClient.post<ClientDetails>('/clients', request),
    grantClientConsent: (clientId: string, type: ConsentType) =>
      restClient.post<ClientConsent>(`/clients/${clientId}/consents`, { type }),
    updateClient: (clientId, changes) =>
      restClient.patch<ClientDetails>(`/clients/${clientId}`, changes),
    listClients: (params) => {
      const searchParams = new URLSearchParams()
      searchParams.append('page', params.page.toString())
      searchParams.append('limit', params.limit.toString())
      if (params.search) searchParams.append('search', params.search)

      return restClient.get<{
        data: unknown[]
        total: number
        page: number
        limit: number
      }>(`/clients?${searchParams.toString()}`)
    },
  }
}

function createCollaboratorDirectoryService(
  restClient: RestClient,
): Pick<
  IdentityRestService,
  | 'listCollaborators'
  | 'listActiveCollaborators'
  | 'listLawyers'
  | 'getCollaborator'
  | 'getCollaboratorProfessionalProfile'
  | 'listCollaboratorJobTitles'
  | 'getCurrentCollaborator'
> {
  return {
    listCollaborators: (query) =>
      restClient.get<PaginationResponse<CollaboratorSummary>>(
        createCollaboratorsPath(query),
      ),
    listActiveCollaborators: (query) => {
      const searchParams = new URLSearchParams()
      searchParams.set('page', String(query.page ?? 1))
      searchParams.set('limit', String(query.limit ?? query.pageSize ?? 50))
      if (query.search) searchParams.set('search', query.search)
      if (query.profile) searchParams.set('profile', query.profile)
      if (query.jobTitle) searchParams.set('jobTitle', query.jobTitle)

      return restClient.get<PaginationResponse<CollaboratorSummary>>(
        `/collaborators/active-collaborators?${searchParams.toString()}`,
      )
    },
    listLawyers: (query) => {
      const searchParams = new URLSearchParams()
      searchParams.set('page', String(query.page ?? 1))
      searchParams.set('limit', String(query.limit ?? 10))
      if (query.search) searchParams.set('search', query.search)

      return restClient.get<PaginationResponse<CollaboratorSummary>>(
        `/collaborators/lawyers?${searchParams.toString()}`,
      )
    },
    getCollaborator: (collaboratorId) =>
      restClient.get<CollaboratorSummary>(`/collaborators/${collaboratorId}`),
    getCollaboratorProfessionalProfile: (collaboratorId) =>
      restClient.get<CollaboratorProfessionalProfile>(
        `/collaborators/${collaboratorId}/professional-profile`,
      ),
    listCollaboratorJobTitles: () =>
      restClient.get<readonly string[]>('/collaborators/job-titles'),
    getCurrentCollaborator: () =>
      restClient.get<CollaboratorSummary>('/collaborators/me'),
  }
}

function createCollaboratorMutationService(
  restClient: RestClient,
): Pick<
  IdentityRestService,
  | 'registerCollaborator'
  | 'updateCollaborator'
  | 'resendCollaboratorInvitation'
  | 'deactivateCollaborator'
  | 'reactivateCollaborator'
  | 'cancelCollaboratorInvitation'
  | 'removeCollaborator'
  | 'completeSignIn'
> {
  return {
    registerCollaborator: (request) =>
      restClient.post<CollaboratorSummary>('/collaborators', request),
    updateCollaborator: (collaboratorId, changes: CollaboratorUpdate) =>
      restClient.patch<CollaboratorSummary>(`/collaborators/${collaboratorId}`, changes),
    resendCollaboratorInvitation: (collaboratorId) =>
      restClient.post<CollaboratorSummary>(
        `/collaborators/${collaboratorId}/invitation/resend`,
        {},
      ),
    deactivateCollaborator: (collaboratorId) =>
      restClient.post<CollaboratorSummary>(
        `/collaborators/${collaboratorId}/deactivate`,
        {},
      ),
    reactivateCollaborator: (collaboratorId) =>
      restClient.post<CollaboratorSummary>(
        `/collaborators/${collaboratorId}/reactivate`,
        {},
      ),
    cancelCollaboratorInvitation: (collaboratorId) =>
      restClient.post<CollaboratorSummary>(
        `/collaborators/${collaboratorId}/invitation/cancel`,
        {},
      ),
    removeCollaborator: (collaboratorId) =>
      restClient.delete<void>(`/collaborators/${collaboratorId}`),
    completeSignIn: () => restClient.post<CollaboratorSummary>('/auth/complete-sign-in'),
  }
}

export const IdentityService = (restClient: RestClient): IdentityRestService => ({
  ...createThirdPartyService(restClient),
  ...createClientService(restClient),
  ...createCollaboratorDirectoryService(restClient),
  ...createCollaboratorMutationService(restClient),
})
