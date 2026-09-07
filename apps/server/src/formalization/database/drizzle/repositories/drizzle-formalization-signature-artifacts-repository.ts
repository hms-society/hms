import { Injectable, Optional } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import {
  DrizzleRepository,
  type DrizzleDatabaseExecutor,
} from '@/shared/database/drizzle/drizzle-repository'

import type { FormalizationSignatureArtifactsRepository } from '@hms/core/formalization/interfaces'
import type { FormalizationSignatureArtifact } from '@hms/core/formalization/domain/entities'
import { DrizzleFormalizationSignatureArtifactMapper } from '@/formalization/database/drizzle/mappers'
import { formalizationSignatureArtifactModel } from '@/formalization/database/drizzle/models'
import { encodeSignatureHash } from '@/formalization/database/drizzle/signature-binary'

@Injectable()
export class DrizzleFormalizationSignatureArtifactsRepository
  extends DrizzleRepository
  implements FormalizationSignatureArtifactsRepository
{
  constructor(
    drizzle: DrizzleClient,
    private readonly mapper: DrizzleFormalizationSignatureArtifactMapper,
    @Optional() databaseOverride?: DrizzleDatabaseExecutor,
  ) {
    super(drizzle, databaseOverride)
  }
  withDatabase(database: DrizzleDatabaseExecutor) {
    return new DrizzleFormalizationSignatureArtifactsRepository(
      this.drizzleClient,
      this.mapper,
      database,
    )
  }
  async add(artifact: FormalizationSignatureArtifact) {
    await this.database
      .insert(formalizationSignatureArtifactModel)
      .values({ ...artifact, sha256: encodeSignatureHash(artifact.sha256) })
  }
  async findByRequestId(requestId: string) {
    const rows = await this.database
      .select()
      .from(formalizationSignatureArtifactModel)
      .where(eq(formalizationSignatureArtifactModel.requestId, requestId))
    return rows.map((row) => this.mapper.toDomain(row))
  }
  async findByRequestDocumentId(requestDocumentId: string) {
    const rows = await this.database
      .select()
      .from(formalizationSignatureArtifactModel)
      .where(eq(formalizationSignatureArtifactModel.requestDocumentId, requestDocumentId))
    return rows.map((row) => this.mapper.toDomain(row))
  }
}
