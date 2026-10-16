export interface ChecklistUploadPublicationRepository {
  publishChecklistUpload(request: {
    documentId: string
    fileId: string
    clientId: string
    caseId: string
    checklistItemId: string
    reviewedAt: Date
  }): Promise<boolean>
}
