import type { FrozenDocumentPdf } from '@hms/core/document-production/domain/entities'
import type { DrizzleFrozenDocumentPdf } from '@/document-production/database/drizzle/types/entities'

export class DrizzleFrozenDocumentPdfMapper {
  toDomain(record: DrizzleFrozenDocumentPdf): FrozenDocumentPdf {
    return {
      ...record,
      sourceDocumentVersionId: record.sourceDocumentVersionId ?? undefined,
      source: record.source as FrozenDocumentPdf['source'],
      pages: [...record.pages],
    }
  }
}
