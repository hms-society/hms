export const formalizationQueryKeys = {
  all: ['formalization'] as const,
  detail: (formalizationId: string) =>
    [...formalizationQueryKeys.all, 'detail', formalizationId] as const,
  documents: (formalizationId: string) =>
    [...formalizationQueryKeys.detail(formalizationId), 'documents'] as const,
  selection: (formalizationId: string) =>
    [...formalizationQueryKeys.detail(formalizationId), 'selection'] as const,
  version: (formalizationId: string, versionId: string) =>
    [...formalizationQueryKeys.detail(formalizationId), 'version', versionId] as const,
}
