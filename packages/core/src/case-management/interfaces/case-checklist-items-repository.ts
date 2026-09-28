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
