import type { DocumentVersion } from '@hms/core/document-production/domain/entities'

import type { DrizzleDocumentVersion } from '@/document-production/database/drizzle/types'

export class DrizzleDocumentVersionMapper {
  toDomain(record: DrizzleDocumentVersion): DocumentVersion {
    return {
      id: record.id,
      documentId: record.documentId,
      documentGenerationId: record.documentGenerationId ?? undefined,
      fileId: record.fileId,
      versionNumber: record.versionNumber,
      source: record.source as DocumentVersion['source'],
      content: record.content,
      pendingMarkers: record.pendingMarkers,
      createdByCollaboratorId: record.createdByCollaboratorId,
      createdAt: record.createdAt,
    }
  }
}
