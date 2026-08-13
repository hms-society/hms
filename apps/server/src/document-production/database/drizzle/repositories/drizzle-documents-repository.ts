import { Injectable } from '@nestjs/common'
import type { DocumentCreation } from '@hms/core/document-production/domain/entities'
import type { DocumentsRepository } from '@hms/core/document-production/interfaces'
import { AppError } from '@hms/core/shared/domain/errors'
import { eq } from 'drizzle-orm'

import { DrizzleDocumentMapper } from '@/document-production/database/drizzle/mappers'
import { documentModel } from '@/document-production/database/drizzle/models'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'

@Injectable()
export class DrizzleDocumentsRepository
  extends DrizzleRepository
  implements DocumentsRepository
{
  constructor(
    drizzle: DrizzleClient,
    private readonly mapper: DrizzleDocumentMapper,
  ) {
    super(drizzle)
  }

  async add(document: DocumentCreation) {
    const [created] = await this.addMany([document])
    if (!created) {
      throw new AppError(
        'Não foi possível persistir o documento.',
        'Erro de Persistência',
      )
    }
    return created
  }

  async addMany(documents: readonly DocumentCreation[]) {
    if (documents.length === 0) return []

    const records = await this.database
      .insert(documentModel)
      .values(documents.map((document) => ({ ...document })))
      .returning()

    return records.map((record) => this.mapper.toDomain(record))
  }

  async findById(documentId: string) {
    const [record] = await this.database
      .select()
      .from(documentModel)
      .where(eq(documentModel.id, documentId))
      .limit(1)

    return record ? this.mapper.toDomain(record) : undefined
  }

  async replace(
    documentId: string,
    changes: Parameters<DocumentsRepository['replace']>[1],
  ) {
    const [record] = await this.database
      .update(documentModel)
      .set({ ...changes, updatedAt: new Date() })
      .where(eq(documentModel.id, documentId))
      .returning()

    return record ? this.mapper.toDomain(record) : undefined
  }

  async removeAll() {
    await this.database.delete(documentModel)
  }
}
