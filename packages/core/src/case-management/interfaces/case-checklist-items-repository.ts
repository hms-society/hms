import type {
  ChecklistDocumentReference,
  ChecklistDocumentWaiver,
  CaseChecklistItemStatusCount,
  CaseChecklistItemStatus,
} from '../domain/structures'
import type { CaseChecklistItem, CaseChecklistItemCreation } from '../domain/entities'

export type MarkChecklistItemValidatedParams = {
  caseId: string
  checklistItemId: string
  documentFileId: string
  documentFileName: string
  validatedBy: string
}

export type LinkChecklistItemPendingDocumentParams = {
  checklistItemId: string
  documentFileId: string
  documentFileName: string
}

export interface CaseChecklistItemsRepository {
  findById(
    caseId: string,
    checklistItemId: string,
  ): Promise<CaseChecklistItem | undefined>
  replace(
    checklistItemId: string,
    changes: {
      status: CaseChecklistItemStatus
      waiver?: ChecklistDocumentWaiver
      documentReference?: ChecklistDocumentReference
      documentFileName?: string
      documentFileId?: string
      validatedAt?: Date
      validatedBy?: string
      updatedAt: Date
    },
    expected: { caseId: string; updatedAt: string; clientDocumentId?: string },
  ): Promise<CaseChecklistItem | undefined>

  addMany(
    checklistItems: readonly CaseChecklistItemCreation[],
  ): Promise<readonly CaseChecklistItem[]>
  hasPendingRequiredItems(caseId: string): Promise<boolean>
  linkPendingDocument(
    params: LinkChecklistItemPendingDocumentParams,
  ): Promise<CaseChecklistItem | undefined>
  markAsInAnalysisByDocument(
    params: LinkChecklistItemPendingDocumentParams,
  ): Promise<CaseChecklistItem | undefined>
  listByCaseId(caseId: string): Promise<readonly CaseChecklistItem[]>
  listStatusCountsByCaseIds(
    caseIds: readonly string[],
  ): Promise<readonly CaseChecklistItemStatusCount[]>
  findByDocumentFileId(documentFileId: string): Promise<CaseChecklistItem | undefined>
  markAsValidatedByDocument(
    params: MarkChecklistItemValidatedParams,
  ): Promise<CaseChecklistItem | undefined>
  replaceForCase(
    caseId: string,
    checklistItems: readonly Omit<CaseChecklistItemCreation, 'caseId'>[],
  ): Promise<readonly CaseChecklistItem[]>
  removeAll(): Promise<void>
}
