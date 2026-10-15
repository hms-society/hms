import type { RestResponse } from '#shared/responses/rest-response.ts'

import type {
  ClientConsent,
  ClientDetails,
  CollaboratorSummary,
  ThirdParty,
} from '../domain/entities'
import type {
  CollaboratorListQuery,
  CollaboratorRegistration,
  ConsentType,
} from '../domain/structures'
import type { CollaboratorUpdate } from '../domain/entities'
import type { PaginationResponse } from '#shared/responses/pagination-response.ts'
import type { LookupClientRequest } from '../use-cases/lookup-client-use-case'
import type { RegisterClientRequest } from '../use-cases/register-client-use-case'
import type { RegisterThirdPartyRequest } from '../use-cases/register-third-party-use-case'
import type { CollaboratorProfessionalProfile } from '../domain/structures/collaborator-professional-profile'

export type ThirdPartyRegistration = Omit<
  RegisterThirdPartyRequest,
  'actorId' | 'actorProfile'
>

export interface IdentityService {
  listThirdParties(): Promise<RestResponse<readonly ThirdParty[]>>
  registerThirdParty(request: ThirdPartyRegistration): Promise<RestResponse<ThirdParty>>
  updateThirdParty(
    thirdPartyId: string,
    changes: Partial<ThirdPartyRegistration>,
  ): Promise<RestResponse<ThirdParty>>
  deactivateThirdParty(thirdPartyId: string): Promise<RestResponse<ThirdParty>>
  reactivateThirdParty(thirdPartyId: string): Promise<RestResponse<ThirdParty>>
  getClient(clientId: string): Promise<RestResponse<ClientDetails>>
  lookupClient(request: LookupClientRequest): Promise<RestResponse<ClientDetails>>
  registerClient(request: RegisterClientRequest): Promise<RestResponse<ClientDetails>>
  grantClientConsent(
    clientId: string,
    type: ConsentType,
  ): Promise<RestResponse<ClientConsent>>
  updateClient(clientId: string, changes: any): Promise<RestResponse<ClientDetails>>
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
    query: Pick<CollaboratorListQuery, 'page' | 'limit' | 'pageSize' | 'search'>,
  ): Promise<RestResponse<PaginationResponse<CollaboratorSummary>>>
  listActiveCollaborators(
    query: Pick<
      CollaboratorListQuery,
      'page' | 'limit' | 'pageSize' | 'search' | 'profile' | 'jobTitle'
    >,
  ): Promise<RestResponse<PaginationResponse<CollaboratorSummary>>>
  getCollaborator(collaboratorId: string): Promise<RestResponse<CollaboratorSummary>>
  getCollaboratorProfessionalProfile(
    collaboratorId: string,
  ): Promise<RestResponse<CollaboratorProfessionalProfile>>
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
