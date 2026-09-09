import { Injectable, Optional } from '@nestjs/common'
import { asc, eq } from 'drizzle-orm'
import type { FormalizationSignatureProviderDocumentResource } from '@hms/core/formalization/domain/entities'
import type { FormalizationSignatureProviderDocumentResourcesRepository } from '@hms/core/formalization/interfaces'

import { DrizzleFormalizationSignatureProviderDocumentResourceMapper } from '@/formalization/database/drizzle/mappers'
import { formalizationSignatureProviderDocumentResourceModel } from '@/formalization/database/drizzle/models'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import {
  DrizzleRepository,
  type DrizzleDatabaseExecutor,
} from '@/shared/database/drizzle/drizzle-repository'

@Injectable()
export class DrizzleFormalizationSignatureProviderDocumentResourcesRepository
  extends DrizzleRepository
  implements FormalizationSignatureProviderDocumentResourcesRepository
{
  constructor(
    drizzle: DrizzleClient,
    private readonly mapper: DrizzleFormalizationSignatureProviderDocumentResourceMapper,
    @Optional() databaseOverride?: DrizzleDatabaseExecutor,
  ) {
    super(drizzle, databaseOverride)
  }

  withDatabase(database: DrizzleDatabaseExecutor) {
    return new DrizzleFormalizationSignatureProviderDocumentResourcesRepository(
      this.drizzleClient,
      this.mapper,
      database,
    )
  }

  async addMany(resources: readonly FormalizationSignatureProviderDocumentResource[]) {
    if (resources.length === 0) return []
    const rows = await this.database
      .insert(formalizationSignatureProviderDocumentResourceModel)
      .values([...resources])
      .returning()
    return rows.map((row) => this.mapper.toDomain(row))
  }

  async listByProviderResourceId(providerResourceId: string) {
    const rows = await this.database
      .select()
      .from(formalizationSignatureProviderDocumentResourceModel)
      .where(
        eq(
          formalizationSignatureProviderDocumentResourceModel.providerResourceId,
          providerResourceId,
        ),
      )
      .orderBy(asc(formalizationSignatureProviderDocumentResourceModel.createdAt))
    return rows.map((row) => this.mapper.toDomain(row))
  }

  findByRequestDocumentId(requestDocumentId: string) {
    return this.findOne(
      eq(
        formalizationSignatureProviderDocumentResourceModel.requestDocumentId,
        requestDocumentId,
      ),
    )
  }

  findByProviderEnvelopeItemId(providerEnvelopeItemId: string) {
    return this.findOne(
      eq(
        formalizationSignatureProviderDocumentResourceModel.providerEnvelopeItemId,
        providerEnvelopeItemId,
      ),
    )
  }

  private async findOne(condition: any) {
    const [row] = await this.database
      .select()
      .from(formalizationSignatureProviderDocumentResourceModel)
      .where(condition)
      .limit(1)
    return row ? this.mapper.toDomain(row) : null
  }
}
