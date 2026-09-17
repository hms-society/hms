export type LinkValidatedDocumentToChecklistRequest = {
  checklistItemId: string
  documentFileId: string
  validatedBy: string
}

export interface CaseChecklistUpdateProvider {
  linkValidatedDocumentToChecklist(
    request: LinkValidatedDocumentToChecklistRequest,
  ): Promise<void>

  linkPendingDocumentToChecklist(request: {
    checklistItemId: string
    documentFileId: string
    documentFileName: string
  }): Promise<void>

  createDocumentPending(request: {
    caseId: string
    checklistItemId: string
    documentFileId: string
    documentFileName?: string
    reason: 'missing' | 'illegible' | 'incomplete' | 'duplicate' | 'not_corresponding'
    details?: string
    responsibleId: string
  }): Promise<void>
}
