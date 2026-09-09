import { Injectable, Optional } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import {
  DrizzleRepository,
  type DrizzleDatabaseExecutor,
} from '@/shared/database/drizzle/drizzle-repository'

import type { FormalizationSignatureProviderResourcesRepository } from '@hms/core/formalization/interfaces'
import type { FormalizationSignatureProviderResource } from '@hms/core/formalization/domain/entities'
import { DrizzleFormalizationSignatureProviderResourceMapper } from '@/formalization/database/drizzle/mappers'
import { formalizationSignatureProviderResourceModel } from '@/formalization/database/drizzle/models'
import { mapSignatureChanges } from './signature-repository-utils'

@Injectable()
export class DrizzleFormalizationSignatureProviderResourcesRepository
  extends DrizzleRepository
  implements FormalizationSignatureProviderResourcesRepository
{
  constructor(
    drizzle: DrizzleClient,
    private readonly mapper: DrizzleFormalizationSignatureProviderResourceMapper,
    @Optional() databaseOverride?: DrizzleDatabaseExecutor,
  ) {
    super(drizzle, databaseOverride)
  }
  withDatabase(database: DrizzleDatabaseExecutor) {
    return new DrizzleFormalizationSignatureProviderResourcesRepository(
      this.drizzleClient,
      this.mapper,
      database,
    )
  }
  async add(resource: FormalizationSignatureProviderResource) {
    await this.database
      .insert(formalizationSignatureProviderResourceModel)
      .values(resource)
  }
  async findByRequestId(requestId: string) {
    return this.findOne(
      eq(formalizationSignatureProviderResourceModel.requestId, requestId),
    )
  }
  async findByProviderEnvelopeId(providerEnvelopeId: string) {
    return this.findOne(
      eq(
        formalizationSignatureProviderResourceModel.providerEnvelopeId,
        providerEnvelopeId,
      ),
    )
  }
  async replace(input: { resourceId: string; changes: any }) {
    await this.database
      .update(formalizationSignatureProviderResourceModel)
      .set(mapSignatureChanges(input.changes))
      .where(eq(formalizationSignatureProviderResourceModel.id, input.resourceId))
  }
  private async findOne(condition: any) {
    const [row] = await this.database
      .select()
      .from(formalizationSignatureProviderResourceModel)
      .where(condition)
      .limit(1)
    return row ? this.mapper.toDomain(row) : null
  }
}
