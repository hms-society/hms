import type { FrozenDocumentPdfCreation } from '@hms/core/document-production/domain/entities'
import type { FrozenDocumentPdfsRepository } from '@hms/core/document-production/interfaces'
import { Injectable } from '@nestjs/common'
import { eq } from 'drizzle-orm'

import { DrizzleFrozenDocumentPdfMapper } from '@/document-production/database/drizzle/mappers'
import { frozenDocumentPdfModel } from '@/document-production/database/drizzle/models'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'

@Injectable()
export class DrizzleFrozenDocumentPdfsRepository
  extends DrizzleRepository
  implements FrozenDocumentPdfsRepository
{
  constructor(
    drizzle: DrizzleClient,
    private readonly mapper: DrizzleFrozenDocumentPdfMapper,
  ) {
    super(drizzle)
  }

  async removeAll() {
    await this.database.delete(frozenDocumentPdfModel)
  }

  async findByDocumentVersionId(documentVersionId: string) {
    const [record] = await this.database
      .select()
      .from(frozenDocumentPdfModel)
      .where(eq(frozenDocumentPdfModel.documentVersionId, documentVersionId))
      .limit(1)

    return record ? this.mapper.toDomain(record) : undefined
  }

  async add(artifact: FrozenDocumentPdfCreation) {
    const [record] = await this.database
      .insert(frozenDocumentPdfModel)
      .values({
        documentId: artifact.documentId,
        documentVersionId: artifact.documentVersionId,
        documentVersionNumber: artifact.documentVersionNumber,
        documentSpecificationId: artifact.documentSpecificationId,
        sourceDocumentVersionId: artifact.sourceDocumentVersionId,
        source: artifact.source,
        sourceFileId: artifact.sourceFileId,
        pdfFileId: artifact.pdfFileId,
        sourceSha256: artifact.sourceSha256,
        pdfSha256: artifact.pdfSha256,
        converterVersion: artifact.converterVersion,
        pageCount: artifact.pageCount,
        pages: artifact.pages,
        byteSize: artifact.byteSize,
        approvedByCollaboratorId: artifact.approvedByCollaboratorId,
        approvedAt: artifact.approvedAt,
        frozenAt: artifact.frozenAt,
      })
      .onConflictDoNothing({ target: frozenDocumentPdfModel.documentVersionId })
      .returning()

    return record ? this.mapper.toDomain(record) : undefined
  }
}
