export type LinkValidatedDocumentToChecklistRequest = {
  checklistItemId: string
  documentFileId: string
  validatedBy: string
}

export interface CaseChecklistUpdateProvider {
  linkValidatedDocumentToChecklist(
    request: LinkValidatedDocumentToChecklistRequest,
  ): Promise<void>
}
