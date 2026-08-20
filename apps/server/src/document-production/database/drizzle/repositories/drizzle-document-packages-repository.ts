import { Injectable } from '@nestjs/common'
import type { DocumentPackageCreation } from '@hms/core/document-production/domain/entities'
import type { DocumentPackagesRepository } from '@hms/core/document-production/interfaces'
import { AppError } from '@hms/core/shared/domain/errors'
import { and, eq } from 'drizzle-orm'

import {
  DrizzleDocumentPackageMapper,
  DrizzlePackageDocumentMapper,
} from '@/document-production/database/drizzle/mappers'
import {
  documentPackageModel,
  packageDocumentModel,
} from '@/document-production/database/drizzle/models'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'

@Injectable()
export class DrizzleDocumentPackagesRepository
  extends DrizzleRepository
  implements DocumentPackagesRepository
{
  constructor(
    drizzle: DrizzleClient,
    private readonly mapper: DrizzleDocumentPackageMapper,
    private readonly packageDocumentMapper: DrizzlePackageDocumentMapper,
  ) {
    super(drizzle)
  }

  async add(documentPackage: DocumentPackageCreation) {
    const [created] = await this.addMany([documentPackage])
    if (!created) {
      throw new AppError(
        'Não foi possível persistir o pacote documental.',
        'Erro de Persistência',
      )
    }
    return created
  }

  async addMany(documentPackages: readonly DocumentPackageCreation[]) {
    if (documentPackages.length === 0) return []

    const records = await this.database
      .insert(documentPackageModel)
      .values(
        documentPackages.map((documentPackage) => ({
          id: documentPackage.id,
          ...this.serializeContext(documentPackage.context),
        })),
      )
      .returning()

    return records.map((record) => this.mapper.toDomain(record))
  }

  async findById(documentPackageId: string) {
    const [record] = await this.database
      .select()
      .from(documentPackageModel)
      .where(eq(documentPackageModel.id, documentPackageId))
      .limit(1)

    return record ? this.mapWithDocuments(record) : undefined
  }

  async findByContext(context: DocumentPackageCreation['context']) {
    const serialized = this.serializeContext(context)
    const [record] = await this.database
      .select()
      .from(documentPackageModel)
      .where(
        and(
          eq(documentPackageModel.contextType, serialized.contextType),
          eq(documentPackageModel.contextId, serialized.contextId),
        ),
      )
      .limit(1)

    return record ? this.mapWithDocuments(record) : undefined
  }

  async confirm(
    documentPackageId: string,
    confirmedByCollaboratorId: string,
    confirmedAt: Date,
  ) {
    const [record] = await this.database
      .update(documentPackageModel)
      .set({ confirmedAt, confirmedByCollaboratorId, updatedAt: confirmedAt })
      .where(eq(documentPackageModel.id, documentPackageId))
      .returning()

    return record ? this.mapWithDocuments(record) : undefined
  }

  async removeAll() {
    await this.database.delete(documentPackageModel)
  }

  private serializeContext(context: DocumentPackageCreation['context']) {
    if (context.type === 'consultation') {
      return { contextType: context.type, contextId: context.consultationId }
    }
    if (context.type === 'formalization') {
      return { contextType: context.type, contextId: context.formalizationId }
    }
    return { contextType: context.type, contextId: context.caseId }
  }

  private async mapWithDocuments(record: typeof documentPackageModel.$inferSelect) {
    const documents = await this.database
      .select()
      .from(packageDocumentModel)
      .where(eq(packageDocumentModel.documentPackageId, record.id))

    return this.mapper.toDomain(
      record,
      documents.map((document) => this.packageDocumentMapper.toDomain(document)),
    )
  }
}
