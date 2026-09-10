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

export interface CaseManagementService {
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
  reviewChecklistGate(
    caseId: string,
    request: ReviewCaseChecklistGateRequest,
  ): Promise<RestResponse<LegalCase>>
}
