export type LinkValidatedDocumentToChecklistRequest = {
  checklistItemId?: string
  documentFileId: string
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
}
