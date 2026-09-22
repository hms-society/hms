import type {
  CaseChecklistItem,
  ChecklistTemplate,
  LegalCase,
  LegalCaseSummary,
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

export interface CaseManagementService {
  createLegalCase(request: CreateLegalCaseRequest): Promise<RestResponse<LegalCase>>

  addComplementaryChecklistItem(
    caseId: string,
    request: AddCaseChecklistComplementaryItemRequest,
  ): Promise<RestResponse<CaseChecklistItem>>

  listCaseChecklist(caseId: string): Promise<RestResponse<readonly CaseChecklistItem[]>>

  listChecklistTemplates(): Promise<RestResponse<readonly ChecklistTemplate[]>>

  listMyCases(): Promise<RestResponse<readonly LegalCaseSummary[]>>

  replaceChecklistTemplate(
    request: ReplaceChecklistTemplateRequest,
  ): Promise<RestResponse<ChecklistTemplate>>

  getLegalCaseDetails(caseId: string): Promise<RestResponse<LegalCaseSummary>>

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
}
