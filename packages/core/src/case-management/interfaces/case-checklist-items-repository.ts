import type { CaseChecklistItem, CaseChecklistItemCreation } from '../domain/entities'

export type MarkChecklistItemValidatedParams = {
  checklistItemId: string
  documentFileId: string
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
  listByCaseId(caseId: string): Promise<readonly CaseChecklistItem[]>
  markAsValidatedByDocument(
    params: MarkChecklistItemValidatedParams,
  ): Promise<CaseChecklistItem | undefined>
  removeAll(): Promise<void>
}
