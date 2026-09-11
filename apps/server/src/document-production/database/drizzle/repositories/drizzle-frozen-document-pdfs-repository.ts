import { Injectable, Optional } from '@nestjs/common'
import type { FrozenDocumentPdfCreation } from '@hms/core/document-production/domain/entities'
import type { FrozenDocumentPdfsRepository } from '@hms/core/document-production/interfaces'
import { eq } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { DrizzleFrozenDocumentPdfMapper } from '@/document-production/database/drizzle/mappers'
import { frozenDocumentPdfModel } from '@/document-production/database/drizzle/models'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import {
  DrizzleRepository,
  type DrizzleDatabaseExecutor,
} from '@/shared/database/drizzle/drizzle-repository'

@Injectable()
export class DrizzleFrozenDocumentPdfsRepository
  extends DrizzleRepository
  implements FrozenDocumentPdfsRepository
{
  constructor(
    drizzle: DrizzleClient,
    private readonly mapper: DrizzleFrozenDocumentPdfMapper,
    @Optional() databaseOverride?: DrizzleDatabaseExecutor,
  ) {
    super(drizzle, databaseOverride)
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
      .values({ ...artifact, id: randomUUID() })
      .onConflictDoNothing({ target: frozenDocumentPdfModel.documentVersionId })
      .returning()
    return record ? this.mapper.toDomain(record) : undefined
  }

  async removeAll() {
    await this.database.delete(frozenDocumentPdfModel)
  }
}
