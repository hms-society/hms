export type LinkValidatedDocumentToChecklistRequest = {
  caseId?: string
  clientId?: string
  checklistItemId?: string
  documentFileId: string
  documentFileName?: string
  validatedBy: string
}

export type MarkDocumentResendRequestedRequest = {
  documentFileId: string
}

export interface CaseChecklistUpdateProvider {
  linkValidatedDocumentToChecklist(
    request: LinkValidatedDocumentToChecklistRequest,
  ): Promise<void>
  markDocumentResendRequested(request: MarkDocumentResendRequestedRequest): Promise<void>

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
