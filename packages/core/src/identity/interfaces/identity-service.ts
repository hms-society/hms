import type { RestResponse } from '#shared/responses/rest-response.ts'

import type {
  ClientConsent,
  ClientDetails,
  CollaboratorSummary,
} from '../domain/entities'
import type {
  CollaboratorListQuery,
  CollaboratorRegistration,
  ConsentType,
} from '../domain/structures'
import type { CollaboratorUpdate } from '../domain/entities'
import type { PaginationResponse } from '#shared/responses/pagination-response.ts'
import type { LookupClientRequest, RegisterClientRequest } from '../use-cases'

export interface IdentityService {
  getClient(clientId: string): Promise<RestResponse<ClientDetails>>
  lookupClient(request: LookupClientRequest): Promise<RestResponse<ClientDetails>>
  registerClient(request: RegisterClientRequest): Promise<RestResponse<ClientDetails>>
  grantClientConsent(
    clientId: string,
    type: ConsentType,
  ): Promise<RestResponse<ClientConsent>>
  listClients(params: {
    page: number
    limit: number
    search?: string
  }): Promise<
    RestResponse<{ data: unknown[]; total: number; page: number; limit: number }>
  >
  listCollaborators(
    query: CollaboratorListQuery,
  ): Promise<RestResponse<PaginationResponse<CollaboratorSummary>>>
  listLawyers(
    query: Pick<CollaboratorListQuery, 'page' | 'limit' | 'search'>,
  ): Promise<RestResponse<PaginationResponse<CollaboratorSummary>>>
  getCollaborator(collaboratorId: string): Promise<RestResponse<CollaboratorSummary>>
  listCollaboratorJobTitles(): Promise<RestResponse<readonly string[]>>
  getCurrentCollaborator(): Promise<RestResponse<CollaboratorSummary>>
  registerCollaborator(
    request: CollaboratorRegistration,
  ): Promise<RestResponse<CollaboratorSummary>>
  updateCollaborator(
    collaboratorId: string,
    changes: CollaboratorUpdate,
  ): Promise<RestResponse<CollaboratorSummary>>
  resendCollaboratorInvitation(
    collaboratorId: string,
  ): Promise<RestResponse<CollaboratorSummary>>
  deactivateCollaborator(
    collaboratorId: string,
  ): Promise<RestResponse<CollaboratorSummary>>
  reactivateCollaborator(
    collaboratorId: string,
  ): Promise<RestResponse<CollaboratorSummary>>
  cancelCollaboratorInvitation(
    collaboratorId: string,
  ): Promise<RestResponse<CollaboratorSummary>>
  removeCollaborator(collaboratorId: string): Promise<RestResponse<void>>
  completeSignIn(): Promise<RestResponse<CollaboratorSummary>>
}
