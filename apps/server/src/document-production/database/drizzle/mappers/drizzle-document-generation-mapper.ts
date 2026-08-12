import type { DocumentGeneration } from '@hms/core/document-production/domain/entities'

import type { DrizzleDocumentGeneration } from '@/document-production/database/drizzle/types'

export class DrizzleDocumentGenerationMapper {
  toDomain(record: DrizzleDocumentGeneration): DocumentGeneration {
    return {
      id: record.id,
      documentId: record.documentId,
      documentSpecificationVersionId: record.documentSpecificationVersionId,
      requestedByCollaboratorId: record.requestedByCollaboratorId,
      source: record.source,
      template: record.template,
      status: record.status as DocumentGeneration['status'],
      attemptsCount: record.attemptsCount,
      findings: record.findings,
      documentVersionId: record.documentVersionId ?? undefined,
      failureMessage: record.failureMessage ?? undefined,
      startedAt: record.startedAt ?? undefined,
      completedAt: record.completedAt ?? undefined,
      failedAt: record.failedAt ?? undefined,
      cancelledAt: record.cancelledAt ?? undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }
  }
}
