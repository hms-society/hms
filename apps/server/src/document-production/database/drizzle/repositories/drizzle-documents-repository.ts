import { Injectable } from '@nestjs/common'
import type { DocumentCreation } from '@hms/core/document-production/domain/entities'
import type { DocumentsRepository } from '@hms/core/document-production/interfaces'
import { AppError } from '@hms/core/shared/domain/errors'
import { eq, inArray } from 'drizzle-orm'

import { DrizzleDocumentMapper } from '@/document-production/database/drizzle/mappers'
import {
  documentModel,
  documentAuditModel,
} from '@/document-production/database/drizzle/models'
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

  async findByIds(documentIds: readonly string[]) {
    if (documentIds.length === 0) return []

    const records = await this.database
      .select()
      .from(documentModel)
      .where(inArray(documentModel.id, [...documentIds]))

    return records.map((record) => this.mapper.toDomain(record))
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

  async updateClassificationWithAudit(
    params: Parameters<DocumentsRepository['updateClassificationWithAudit']>[0],
  ): Promise<void> {
    await this.database.transaction(async (tx) => {
      const [doc] = await tx
        .select({ classificacaoAcesso: documentModel.classificacaoAcesso })
        .from(documentModel)
        .where(eq(documentModel.id, params.documentId))
        .for('update')

      if (!doc) {
        throw new Error('Documento não encontrado.')
      }

      const valorAnterior = doc.classificacaoAcesso

      await tx
        .update(documentModel)
        .set({
          classificacaoAcesso: params.valorNovo,
          updatedAt: new Date(),
        })
        .where(eq(documentModel.id, params.documentId))

      await tx.insert(documentAuditModel).values({
        documentoId: params.documentId,
        usuarioResponsavelId: params.userId,
        valorAnterior,
        valorNovo: params.valorNovo,
      })
    })
  }

  async removeAll() {
    await this.database.delete(documentModel)
  }
}
