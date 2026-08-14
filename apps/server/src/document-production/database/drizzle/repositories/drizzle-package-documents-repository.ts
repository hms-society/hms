import { Injectable } from '@nestjs/common'
import type { PackageDocumentCreation } from '@hms/core/document-production/domain/entities'
import type { PackageDocumentsRepository } from '@hms/core/document-production/interfaces'
import { AppError } from '@hms/core/shared/domain/errors'
import { eq } from 'drizzle-orm'

import { DrizzlePackageDocumentMapper } from '@/document-production/database/drizzle/mappers'
import { packageDocumentModel } from '@/document-production/database/drizzle/models'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'

@Injectable()
export class DrizzlePackageDocumentsRepository
  extends DrizzleRepository
  implements PackageDocumentsRepository
{
  constructor(
    drizzle: DrizzleClient,
    private readonly mapper: DrizzlePackageDocumentMapper,
  ) {
    super(drizzle)
  }

  async add(packageDocument: PackageDocumentCreation) {
    const [created] = await this.addMany([packageDocument])
    if (!created) {
      throw new AppError(
        'Não foi possível adicionar o documento ao pacote.',
        'Erro de Persistência',
      )
    }
    return created
  }

  async addMany(packageDocuments: readonly PackageDocumentCreation[]) {
    if (packageDocuments.length === 0) return []

    const records = await this.database
      .insert(packageDocumentModel)
      .values(packageDocuments.map((packageDocument) => ({ ...packageDocument })))
      .returning()

    return records.map((record) => this.mapper.toDomain(record))
  }

  async findByDocumentPackageId(documentPackageId: string) {
    const records = await this.database
      .select()
      .from(packageDocumentModel)
      .where(eq(packageDocumentModel.documentPackageId, documentPackageId))

    return records.map((record) => this.mapper.toDomain(record))
  }

  async replaceForDocumentPackage(
    documentPackageId: string,
    packageDocuments: readonly PackageDocumentCreation[],
  ) {
    return this.database.transaction(async (transaction) => {
      await transaction
        .delete(packageDocumentModel)
        .where(eq(packageDocumentModel.documentPackageId, documentPackageId))

      if (packageDocuments.length === 0) return []

      const records = await transaction
        .insert(packageDocumentModel)
        .values(packageDocuments.map((packageDocument) => ({ ...packageDocument })))
        .returning()

      return records.map((record) => this.mapper.toDomain(record))
    })
  }

  async removeAll() {
    await this.database.delete(packageDocumentModel)
  }
}
