import { Injectable, Optional } from '@nestjs/common'
import { and, asc, eq } from 'drizzle-orm'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import {
  DrizzleRepository,
  type DrizzleDatabaseExecutor,
} from '@/shared/database/drizzle/drizzle-repository'

import type { FormalizationSignatureRequestDocumentsRepository } from '@hms/core/formalization/interfaces'
import type { FormalizationSignatureRequestDocument } from '@hms/core/formalization/domain/entities'
import { DrizzleFormalizationSignatureRequestDocumentMapper } from '@/formalization/database/drizzle/mappers'
import { formalizationSignatureRequestDocumentModel } from '@/formalization/database/drizzle/models'
import { encodeSignatureHash } from '@/formalization/database/drizzle/signature-binary'
import {
  mapSignatureChanges,
  withNextSignatureVersion,
} from './signature-repository-utils'

@Injectable()
export class DrizzleFormalizationSignatureRequestDocumentsRepository
  extends DrizzleRepository
  implements FormalizationSignatureRequestDocumentsRepository
{
  constructor(
    drizzle: DrizzleClient,
    private readonly mapper: DrizzleFormalizationSignatureRequestDocumentMapper,
    @Optional() databaseOverride?: DrizzleDatabaseExecutor,
  ) {
    super(drizzle, databaseOverride)
  }
  withDatabase(database: DrizzleDatabaseExecutor) {
    return new DrizzleFormalizationSignatureRequestDocumentsRepository(
      this.drizzleClient,
      this.mapper,
      database,
    )
  }
  async addMany(documents: readonly FormalizationSignatureRequestDocument[]) {
    if (documents.length === 0) return []
    const rows = await this.database
      .insert(formalizationSignatureRequestDocumentModel)
      .values(
        documents.map((document) => ({
          ...document,
          unsignedSha256: encodeSignatureHash(document.unsignedSha256),
        })),
      )
      .returning()
    return rows.map((row) => this.mapper.toDomain(row))
  }
  async findById(requestDocumentId: string) {
    const [row] = await this.database
      .select()
      .from(formalizationSignatureRequestDocumentModel)
      .where(eq(formalizationSignatureRequestDocumentModel.id, requestDocumentId))
      .limit(1)
    return row ? this.mapper.toDomain(row) : null
  }
  async listByRequestId(requestId: string) {
    const rows = await this.database
      .select()
      .from(formalizationSignatureRequestDocumentModel)
      .where(eq(formalizationSignatureRequestDocumentModel.requestId, requestId))
      .orderBy(asc(formalizationSignatureRequestDocumentModel.position))
    return rows.map((row) => this.mapper.toDomain(row))
  }
  async replace(input: {
    requestDocumentId: string
    expectedVersion: number
    changes: any
  }) {
    const [row] = await this.database
      .update(formalizationSignatureRequestDocumentModel)
      .set({
        ...mapSignatureChanges(input.changes),
        updatedAt: new Date(),
        version: withNextSignatureVersion(
          formalizationSignatureRequestDocumentModel.version,
        ),
      })
      .where(
        and(
          eq(formalizationSignatureRequestDocumentModel.id, input.requestDocumentId),
          eq(formalizationSignatureRequestDocumentModel.version, input.expectedVersion),
        ),
      )
      .returning()
    return row ? !!this.mapper.toDomain(row) : false
  }
}
