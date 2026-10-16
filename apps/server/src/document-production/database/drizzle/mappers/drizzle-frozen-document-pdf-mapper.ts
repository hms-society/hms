import type { FrozenDocumentPdf } from '@hms/core/document-production/domain/entities'

import type { DrizzleFrozenDocumentPdf } from '@/document-production/database/drizzle/types'

export class DrizzleFrozenDocumentPdfMapper {
  toDomain(record: DrizzleFrozenDocumentPdf): FrozenDocumentPdf {
    return {
      id: record.id,
      documentId: record.documentId,
      documentVersionId: record.documentVersionId,
      documentVersionNumber: record.documentVersionNumber,
      documentSpecificationId: record.documentSpecificationId,
      sourceDocumentVersionId: record.sourceDocumentVersionId ?? undefined,
      source: record.source,
      sourceFileId: record.sourceFileId,
      pdfFileId: record.pdfFileId,
      sourceSha256: record.sourceSha256,
      pdfSha256: record.pdfSha256,
      converterVersion: record.converterVersion,
      pageCount: record.pageCount,
      pages: record.pages,
      byteSize: record.byteSize,
      approvedByCollaboratorId: record.approvedByCollaboratorId,
      approvedAt: record.approvedAt,
      frozenAt: record.frozenAt,
      createdAt: record.createdAt,
    }
  }
}
