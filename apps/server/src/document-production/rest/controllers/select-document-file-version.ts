import type { DocumentVersion } from '@hms/core/document-production/domain/entities'

export function selectDocumentFileVersion(
  versions: readonly DocumentVersion[],
  versionId?: string,
): DocumentVersion | undefined {
  if (versionId) return versions.find((version) => version.id === versionId)

  return versions.reduce<DocumentVersion | undefined>(
    (latest, candidate) =>
      !latest || candidate.versionNumber > latest.versionNumber ? candidate : latest,
    undefined,
  )
}
