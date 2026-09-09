import { Injectable, Optional } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import {
  DrizzleRepository,
  type DrizzleDatabaseExecutor,
} from '@/shared/database/drizzle/drizzle-repository'

import type { FormalizationSignatureProviderRecipientResourcesRepository } from '@hms/core/formalization/interfaces'
import type { FormalizationSignatureProviderRecipientResource } from '@hms/core/formalization/domain/entities'
import { DrizzleFormalizationSignatureProviderRecipientResourceMapper } from '@/formalization/database/drizzle/mappers'
import { formalizationSignatureProviderRecipientResourceModel } from '@/formalization/database/drizzle/models'
import { encodeSignaturePayload } from '@/formalization/database/drizzle/signature-binary'
import { mapSignatureChanges } from './signature-repository-utils'

@Injectable()
export class DrizzleFormalizationSignatureProviderRecipientResourcesRepository
  extends DrizzleRepository
  implements FormalizationSignatureProviderRecipientResourcesRepository
{
  constructor(
    drizzle: DrizzleClient,
    private readonly mapper: DrizzleFormalizationSignatureProviderRecipientResourceMapper,
    @Optional() databaseOverride?: DrizzleDatabaseExecutor,
  ) {
    super(drizzle, databaseOverride)
  }
  withDatabase(database: DrizzleDatabaseExecutor) {
    return new DrizzleFormalizationSignatureProviderRecipientResourcesRepository(
      this.drizzleClient,
      this.mapper,
      database,
    )
  }
  async addMany(resources: readonly FormalizationSignatureProviderRecipientResource[]) {
    if (resources.length === 0) return []
    const rows = await this.database
      .insert(formalizationSignatureProviderRecipientResourceModel)
      .values(
        resources.map((resource) => ({
          ...resource,
          encryptedSigningCredential: encodeSignaturePayload(
            resource.encryptedSigningCredential,
          ),
        })),
      )
      .returning()
    return rows.map((row) => this.mapper.toDomain(row))
  }
  async listByProviderResourceId(providerResourceId: string) {
    const rows = await this.database
      .select()
      .from(formalizationSignatureProviderRecipientResourceModel)
      .where(
        eq(
          formalizationSignatureProviderRecipientResourceModel.providerResourceId,
          providerResourceId,
        ),
      )
    return rows.map((row) => this.mapper.toDomain(row))
  }
  async findByRecipientId(recipientId: string) {
    return this.findOne(
      eq(formalizationSignatureProviderRecipientResourceModel.recipientId, recipientId),
    )
  }
  async findByProviderRecipientId(providerRecipientId: string) {
    return this.findOne(
      eq(
        formalizationSignatureProviderRecipientResourceModel.providerRecipientId,
        providerRecipientId,
      ),
    )
  }
  async replace(input: { resourceId: string; changes: any }) {
    await this.database
      .update(formalizationSignatureProviderRecipientResourceModel)
      .set(mapSignatureChanges(input.changes))
      .where(
        eq(formalizationSignatureProviderRecipientResourceModel.id, input.resourceId),
      )
  }
  private async findOne(condition: any) {
    const [row] = await this.database
      .select()
      .from(formalizationSignatureProviderRecipientResourceModel)
      .where(condition)
      .limit(1)
    return row ? this.mapper.toDomain(row) : null
  }
}
