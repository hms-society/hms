import type { DocumentVersionHomologation } from '@hms/core/document-production/domain/entities'

import type { DrizzleDocumentVersionHomologation } from '@/document-production/database/drizzle/types'

export class DrizzleDocumentVersionHomologationMapper {
  toDomain(record: DrizzleDocumentVersionHomologation): DocumentVersionHomologation {
    return {
      id: record.id,
      caseId: record.caseId,
      documentId: record.documentId,
      documentVersionId: record.documentVersionId,
      approvedByCollaboratorId: record.approvedByCollaboratorId,
      approvedByCollaboratorName: record.approvedByCollaboratorName,
      approvedByCollaboratorProfile:
        record.approvedByCollaboratorProfile as DocumentVersionHomologation['approvedByCollaboratorProfile'],
      approvedAt: record.approvedAt,
    }
  }
}
