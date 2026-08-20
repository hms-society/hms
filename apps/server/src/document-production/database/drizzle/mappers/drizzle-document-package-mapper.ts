import type {
  DocumentPackage,
  PackageDocument,
} from '@hms/core/document-production/domain/entities'

import type { DrizzleDocumentPackage } from '@/document-production/database/drizzle/types'

export class DrizzleDocumentPackageMapper {
  toDomain(
    record: DrizzleDocumentPackage,
    documents: readonly PackageDocument[] = [],
  ): DocumentPackage {
    const context =
      record.contextType === 'consultation'
        ? { type: 'consultation' as const, consultationId: record.contextId }
        : record.contextType === 'formalization'
          ? { type: 'formalization' as const, formalizationId: record.contextId }
          : { type: 'case' as const, caseId: record.contextId }

    return {
      id: record.id,
      context,
      documents,
      confirmedAt: record.confirmedAt ?? undefined,
      confirmedByCollaboratorId: record.confirmedByCollaboratorId ?? undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }
  }
}
