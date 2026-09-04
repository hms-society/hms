import { Injectable, Optional } from '@nestjs/common'
import { asc, eq } from 'drizzle-orm'
import type { FormalizationSignatureRecipientDocument } from '@hms/core/formalization/domain/entities'
import type { FormalizationSignatureRecipientDocumentsRepository } from '@hms/core/formalization/interfaces'

import { DrizzleFormalizationSignatureRecipientDocumentMapper } from '@/formalization/database/drizzle/mappers'
import { formalizationSignatureRecipientDocumentModel } from '@/formalization/database/drizzle/models'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import {
  DrizzleRepository,
  type DrizzleDatabaseExecutor,
} from '@/shared/database/drizzle/drizzle-repository'

@Injectable()
export class DrizzleFormalizationSignatureRecipientDocumentsRepository
  extends DrizzleRepository
  implements FormalizationSignatureRecipientDocumentsRepository
{
  constructor(
    drizzle: DrizzleClient,
    private readonly mapper: DrizzleFormalizationSignatureRecipientDocumentMapper,
    @Optional() databaseOverride?: DrizzleDatabaseExecutor,
  ) {
    super(drizzle, databaseOverride)
  }

  withDatabase(database: DrizzleDatabaseExecutor) {
    return new DrizzleFormalizationSignatureRecipientDocumentsRepository(
      this.drizzleClient,
      this.mapper,
      database,
    )
  }

  async addMany(assignments: readonly FormalizationSignatureRecipientDocument[]) {
    if (assignments.length === 0) return []
    const rows = await this.database
      .insert(formalizationSignatureRecipientDocumentModel)
      .values([...assignments])
      .returning()
    return rows.map((row) => this.mapper.toDomain(row))
  }

  listByRequestId(requestId: string) {
    return this.listBy(
      eq(formalizationSignatureRecipientDocumentModel.requestId, requestId),
    )
  }

  listByRecipientId(recipientId: string) {
    return this.listBy(
      eq(formalizationSignatureRecipientDocumentModel.recipientId, recipientId),
    )
  }

  listByRequestDocumentId(requestDocumentId: string) {
    return this.listBy(
      eq(
        formalizationSignatureRecipientDocumentModel.requestDocumentId,
        requestDocumentId,
      ),
    )
  }

  private async listBy(condition: Parameters<typeof eq>[0] extends never ? never : any) {
    const rows = await this.database
      .select()
      .from(formalizationSignatureRecipientDocumentModel)
      .where(condition)
      .orderBy(asc(formalizationSignatureRecipientDocumentModel.createdAt))
    return rows.map((row) => this.mapper.toDomain(row))
  }
}
