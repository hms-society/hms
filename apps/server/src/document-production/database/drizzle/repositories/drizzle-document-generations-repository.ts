import { Injectable } from '@nestjs/common'
import type { DocumentGenerationCreation } from '@hms/core/document-production/domain/entities'
import type { DocumentGenerationsRepository } from '@hms/core/document-production/interfaces'
import { AppError } from '@hms/core/shared/domain/errors'
import type {
  DocumentGenerationStatus,
  DocumentGenerationUpdate,
} from '@hms/core/document-production/domain/structures'
import { and, desc, eq, inArray } from 'drizzle-orm'

import { DrizzleDocumentGenerationMapper } from '@/document-production/database/drizzle/mappers'
import { documentGenerationModel } from '@/document-production/database/drizzle/models'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'

@Injectable()
export class DrizzleDocumentGenerationsRepository
  extends DrizzleRepository
  implements DocumentGenerationsRepository
{
  constructor(
    drizzle: DrizzleClient,
    private readonly mapper: DrizzleDocumentGenerationMapper,
  ) {
    super(drizzle)
  }

  async add(generation: DocumentGenerationCreation) {
    const [record] = await this.database
      .insert(documentGenerationModel)
      .values({
        id: generation.id,
        documentId: generation.documentId,
        documentSpecificationVersionId: generation.documentSpecificationVersionId,
        requestedByCollaboratorId: generation.requestedByCollaboratorId,
        source: generation.source,
        template: generation.template,
        status: generation.status,
        attemptsCount: generation.attemptsCount,
        findings: generation.findings,
      })
      .returning()

    if (!record) {
      throw new AppError(
        'Não foi possível persistir a geração documental.',
        'Erro de Persistência',
      )
    }

    return this.mapper.toDomain(record)
  }

  async findById(documentGenerationId: string) {
    const [record] = await this.database
      .select()
      .from(documentGenerationModel)
      .where(eq(documentGenerationModel.id, documentGenerationId))
      .limit(1)

    return record ? this.mapper.toDomain(record) : undefined
  }

  async findLatestByDocumentId(documentId: string) {
    const [record] = await this.database
      .select()
      .from(documentGenerationModel)
      .where(eq(documentGenerationModel.documentId, documentId))
      .orderBy(desc(documentGenerationModel.createdAt))
      .limit(1)

    return record ? this.mapper.toDomain(record) : undefined
  }

  async replace(
    documentGenerationId: string,
    changes: DocumentGenerationUpdate,
    expectedStatuses: readonly DocumentGenerationStatus[],
  ) {
    if (expectedStatuses.length === 0) return undefined

    const [record] = await this.database
      .update(documentGenerationModel)
      .set(changes)
      .where(
        and(
          eq(documentGenerationModel.id, documentGenerationId),
          inArray(documentGenerationModel.status, [...expectedStatuses]),
        ),
      )
      .returning()

    return record ? this.mapper.toDomain(record) : undefined
  }
}
