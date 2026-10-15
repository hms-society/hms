import type { DocumentVersionHomologation } from '@hms/core/document-production/domain/entities'
import type {
  AddDocumentVersionHomologation,
  DocumentVersionHomologationsRepository,
} from '@hms/core/document-production/interfaces'
import { eq } from 'drizzle-orm'
import { Injectable } from '@nestjs/common'

import { DrizzleDocumentVersionHomologationMapper } from '@/document-production/database/drizzle/mappers'
import { documentVersionHomologationModel } from '@/document-production/database/drizzle/models'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'
import { AppError } from '@hms/core/shared/domain/errors'

@Injectable()
export class DrizzleDocumentVersionHomologationsRepository
  extends DrizzleRepository
  implements DocumentVersionHomologationsRepository
{
  constructor(
    drizzle: DrizzleClient,
    private readonly mapper: DrizzleDocumentVersionHomologationMapper,
  ) {
    super(drizzle)
  }

  async add(
    homologation: AddDocumentVersionHomologation,
  ): Promise<DocumentVersionHomologation> {
    const [record] = await this.database
      .insert(documentVersionHomologationModel)
      .values(homologation)
      .returning()

    if (!record) {
      throw new AppError(
        'Não foi possível persistir a homologação documental.',
        'Erro de Persistência',
      )
    }
    return this.mapper.toDomain(record)
  }

  async findByDocumentVersionId(documentVersionId: string) {
    const [record] = await this.database
      .select()
      .from(documentVersionHomologationModel)
      .where(eq(documentVersionHomologationModel.documentVersionId, documentVersionId))
      .limit(1)

    return record ? this.mapper.toDomain(record) : undefined
  }

  async attachArtifact(
    homologationId: string,
    artifact: {
      fileId: string
      storagePath: string
      contentType: string
      createdAt: Date
    },
  ) {
    const [record] = await this.database
      .update(documentVersionHomologationModel)
      .set({
        artifactFileId: artifact.fileId,
        artifactStoragePath: artifact.storagePath,
        artifactContentType: artifact.contentType,
        artifactCreatedAt: artifact.createdAt,
      })
      .where(eq(documentVersionHomologationModel.id, homologationId))
      .returning()

    return record ? this.mapper.toDomain(record) : undefined
  }
}
