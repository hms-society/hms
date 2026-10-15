export type LinkValidatedDocumentToChecklistRequest = {
  caseId?: string
  clientId?: string
  checklistItemId?: string
  documentFileId: string
  documentFileName?: string
  validatedBy: string
  actorId: string
}

export type MarkDocumentResendRequestedRequest = {
  documentFileId: string
  caseId?: string
  actorId: string
}

export interface CaseChecklistUpdateProvider {
  linkValidatedDocumentToChecklist(
    request: LinkValidatedDocumentToChecklistRequest,
  ): Promise<void>
  markDocumentResendRequested(request: MarkDocumentResendRequestedRequest): Promise<void>

  linkPendingDocumentToChecklist(request: {
    caseId?: string
    checklistItemId: string
    documentFileId: string
    documentFileName: string
    actorId: string
  }): Promise<void>

  createDocumentPending(request: {
    caseId: string
    checklistItemId: string
    documentFileId: string
    documentFileName?: string
    reason: 'missing' | 'illegible' | 'incomplete' | 'duplicate' | 'not_corresponding'
    details?: string
    responsibleId: string
    actorId: string
  }): Promise<void>
}
