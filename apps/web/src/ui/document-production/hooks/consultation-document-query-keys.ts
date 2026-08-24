export const consultationDocumentQueryKeys = {
  all: ['consultation-documents'] as const,
  list: (consultationId: string) =>
    [...consultationDocumentQueryKeys.all, consultationId] as const,
  selection: (consultationId: string) =>
    [...consultationDocumentQueryKeys.list(consultationId), 'selection'] as const,
  version: (consultationId: string, documentId: string, documentVersionId: string) =>
    [
      ...consultationDocumentQueryKeys.list(consultationId),
      'version',
      documentId,
      documentVersionId,
    ] as const,
}
