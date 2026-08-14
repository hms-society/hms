import type { DocumentVersionCreation } from '@hms/core/document-production/domain/entities'
import type { DocumentVersionsRepository } from '@hms/core/document-production/interfaces'
import { AppError } from '@hms/core/shared/domain/errors'
import { and, asc, desc, eq, inArray } from 'drizzle-orm'
import { Injectable } from '@nestjs/common'

import { DrizzleDocumentVersionMapper } from '@/document-production/database/drizzle/mappers'
import { documentVersionModel } from '@/document-production/database/drizzle/models'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'

@Injectable()
export class DrizzleDocumentVersionsRepository
  extends DrizzleRepository
  implements DocumentVersionsRepository
{
  constructor(
    drizzle: DrizzleClient,
    private readonly mapper: DrizzleDocumentVersionMapper,
  ) {
    super(drizzle)
  }

  async add(version: DocumentVersionCreation) {
    const [record] = await this.database
      .insert(documentVersionModel)
      .values(version)
      .returning()

    if (!record) {
      throw new AppError(
        'Não foi possível persistir a versão documental.',
        'Erro de Persistência',
      )
    }

    return this.mapper.toDomain(record)
  }

  async removeAll() {
    await this.database.delete(documentVersionModel)
  }

  async findLatestByDocumentId(documentId: string) {
    const [record] = await this.database
      .select()
      .from(documentVersionModel)
      .where(eq(documentVersionModel.documentId, documentId))
      .orderBy(desc(documentVersionModel.versionNumber))
      .limit(1)

    return record ? this.mapper.toDomain(record) : undefined
  }

  async findByDocumentGenerationId(documentGenerationId: string) {
    const [record] = await this.database
      .select()
      .from(documentVersionModel)
      .where(eq(documentVersionModel.documentGenerationId, documentGenerationId))
      .limit(1)

    return record ? this.mapper.toDomain(record) : undefined
  }

  async findById(documentVersionId: string) {
    const [record] = await this.database
      .select()
      .from(documentVersionModel)
      .where(eq(documentVersionModel.id, documentVersionId))
      .limit(1)
    return record ? this.mapper.toDomain(record) : undefined
  }

  async findByDocumentIds(documentIds: readonly string[]) {
    if (documentIds.length === 0) return []

    const records = await this.database
      .select()
      .from(documentVersionModel)
      .where(inArray(documentVersionModel.documentId, [...documentIds]))
      .orderBy(
        asc(documentVersionModel.documentId),
        desc(documentVersionModel.versionNumber),
      )

    return records.map((record) => this.mapper.toDomain(record))
  }

  async review(
    documentVersionId: string,
    status: 'approved' | 'rejected',
    reviewedByCollaboratorId: string,
    reviewedAt: Date,
    rejectionReason?: string,
  ) {
    const [record] = await this.database
      .update(documentVersionModel)
      .set({
        status,
        reviewedByCollaboratorId,
        reviewedAt,
        rejectionReason: rejectionReason ?? null,
      })
      .where(
        and(
          eq(documentVersionModel.id, documentVersionId),
          eq(documentVersionModel.status, 'in_review'),
        ),
      )
      .returning()
    return record ? this.mapper.toDomain(record) : undefined
  }
}
