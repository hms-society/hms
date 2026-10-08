import type {
  CaseChecklistItem,
  ChecklistTemplate,
  LegalCase,
  LegalCaseSummary,
  Pending,
  AssistedMessage,
} from '../domain/entities'
import type {
  CaseChecklistGateDecision,
  ChecklistDocumentType,
} from '../domain/structures'
import type { RestResponse } from '#shared/responses/rest-response'
import type {
  CaseEligibleCollaborator,
  CaseTeam,
  CaseTeamCandidatesQuery,
  CaseTeamMutationResult,
} from '../domain/structures'
import type { CaseTeamHistory } from '../domain/entities'
import type { PaginationResponse } from '#shared/responses/pagination-response'
import type { AddCaseTeamMemberRequest } from '../use-cases/add-case-team-member-request'
import type { ChangeCaseTeamMemberRoleRequest } from '../use-cases/change-case-team-member-role-request'
import type { RemoveCaseTeamMemberRequest } from '../use-cases/remove-case-team-member-request'

export type ReviewCaseChecklistGateRequest = {
  decision: CaseChecklistGateDecision
  remarks?: string
}

export type PortalDocumentUploadResponse = {
  protocol: string
  checklistItemId: string
  status: string
  sentAt: string
}

export type GrantCasePortalAccessResponse = {
  grantId: string
  caseId: string
  accessToken: string
  portalAccessUrl: string
  expiresAt: string | null
  canUpload: boolean
  canViewCaseStatus: boolean
  canViewIntakeStatus: boolean
}

export type GrantCasePortalAccessRequest = {
  canUpload: boolean
  canViewCaseStatus: boolean
  canViewIntakeStatus: boolean
  thirdPartyId?: string
}

export type CasePortalAccessSummary = {
  grantId: string
  caseId: string
  thirdPartyId?: string
  canUpload: boolean
  canViewCaseStatus: boolean
  canViewIntakeStatus: boolean
  createdAt: string
}

export type ThirdPartyPortalCaseResponse = {
  caseId: string
  publicCode: string
  title: string
  clientName: string
  status?: LegalCase['status']
  intakeId?: string
  updatedAt?: string
  canUpload: boolean
  canViewCaseStatus: boolean
  canViewIntakeStatus: boolean
  intake?: {
    id: string
    status: string
    updatedAt: string
  }
}

export type AddCaseChecklistComplementaryItemRequest = {
  templateItemKey: string
  title: string
}

export type ReplaceChecklistTemplateRequest = {
  checklistTemplateId?: string
  legalAreaId: string
  name: string
  isActive: boolean
  items: readonly {
    title: string
    documentTypes: readonly ChecklistDocumentType[]
    isRequired: boolean
    position: number
  }[]
}

export type CreateLegalCaseRequest = {
  title: string
  intakeId: string
  legalAreaId: string
  legalTopicId: string
  team: Array<{
    collaboratorId: string
    role: string
    permission: string
  }>
}

export type CreatePendingRequest = {
  checklistItemId: string
  documentFileId?: string
  documentFileName?: string
  reason: import('../domain/structures').PendingReason
  details?: string
}

export interface CaseManagementService {
  createLegalCase(request: CreateLegalCaseRequest): Promise<RestResponse<LegalCase>>
  getCaseTeam(caseId: string): Promise<RestResponse<CaseTeam>>
  listCaseTeamCandidates(
    query: CaseTeamCandidatesQuery,
    caseId?: string,
  ): Promise<RestResponse<PaginationResponse<CaseEligibleCollaborator>>>
  addCaseTeamMember(
    caseId: string,
    request: Omit<AddCaseTeamMemberRequest, 'actorId' | 'caseId'>,
  ): Promise<RestResponse<CaseTeamMutationResult>>
  changeCaseTeamMemberRole(
    caseId: string,
    membershipId: string,
    request: Omit<ChangeCaseTeamMemberRoleRequest, 'actorId' | 'caseId' | 'membershipId'>,
  ): Promise<RestResponse<CaseTeamMutationResult>>
  removeCaseTeamMember(
    caseId: string,
    membershipId: string,
    request: Omit<RemoveCaseTeamMemberRequest, 'actorId' | 'caseId' | 'membershipId'>,
  ): Promise<RestResponse<CaseTeamMutationResult>>
  listCaseTeamHistory(
    caseId: string,
    page: number,
    pageSize: number,
  ): Promise<RestResponse<PaginationResponse<CaseTeamHistory>>>

  addComplementaryChecklistItem(
    caseId: string,
    request: AddCaseChecklistComplementaryItemRequest,
  ): Promise<RestResponse<CaseChecklistItem>>

  listCaseChecklist(
    caseId: string,
    clientId?: string,
  ): Promise<RestResponse<readonly CaseChecklistItem[]>>

  listChecklistTemplates(): Promise<RestResponse<readonly ChecklistTemplate[]>>

  listMyCases(clientId?: string): Promise<RestResponse<readonly LegalCaseSummary[]>>

  replaceChecklistTemplate(
    request: ReplaceChecklistTemplateRequest,
  ): Promise<RestResponse<ChecklistTemplate>>

  getLegalCaseDetails(caseId: string): Promise<RestResponse<LegalCaseSummary>>

  grantCasePortalAccess(
    caseId: string,
    request: GrantCasePortalAccessRequest,
  ): Promise<RestResponse<GrantCasePortalAccessResponse>>
  listCasePortalAccess(
    caseId: string,
  ): Promise<RestResponse<readonly CasePortalAccessSummary[]>>

  reviewChecklistGate(
    caseId: string,
    request: ReviewCaseChecklistGateRequest,
  ): Promise<RestResponse<LegalCase>>

  homologateDossier(caseId: string): Promise<RestResponse<LegalCase>>

  listPortalPendingChecklist(
    caseId: string,
    portalToken: string,
  ): Promise<RestResponse<readonly CaseChecklistItem[]>>

  getThirdPartyPortalCase(
    caseId: string,
    portalToken: string,
  ): Promise<RestResponse<ThirdPartyPortalCaseResponse>>

  uploadPortalDocument(
    caseId: string,
    checklistItemId: string,
    portalToken: string,
    file: unknown,
  ): Promise<RestResponse<PortalDocumentUploadResponse>>

  listCasePendings(caseId: string): Promise<RestResponse<readonly Pending[]>>

  getPendingMessage(pendingId: string): Promise<RestResponse<AssistedMessage>>

  editPendingMessage(
    pendingId: string,
    request: Pick<AssistedMessage, 'subject' | 'body'>,
  ): Promise<RestResponse<AssistedMessage>>

  approvePendingMessage(pendingId: string): Promise<RestResponse<AssistedMessage>>

  createPending(
    caseId: string,
    request: CreatePendingRequest,
  ): Promise<RestResponse<Pending>>
}
