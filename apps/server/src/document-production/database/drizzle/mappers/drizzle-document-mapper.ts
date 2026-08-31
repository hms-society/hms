import type { Document } from '@hms/core/document-production/domain/entities'

import type { DrizzleDocument } from '@/document-production/database/drizzle/types'

export class DrizzleDocumentMapper {
  toDomain(record: DrizzleDocument): Document {
    return {
      id: record.id,
      title: record.title,
      classificacaoAcesso: record.classificacaoAcesso,
      currentVersionId: record.currentVersionId ?? undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }
  }
}
