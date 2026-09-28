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
  expiresAt: string
  canUpload: boolean
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
    request: { canUpload: boolean },
  ): Promise<RestResponse<GrantCasePortalAccessResponse>>

  reviewChecklistGate(
    caseId: string,
    request: ReviewCaseChecklistGateRequest,
  ): Promise<RestResponse<LegalCase>>

  listPortalPendingChecklist(
    caseId: string,
    portalToken: string,
  ): Promise<RestResponse<readonly CaseChecklistItem[]>>

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
