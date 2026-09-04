import { Injectable, Optional } from '@nestjs/common'
import { and, eq } from 'drizzle-orm'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import {
  DrizzleRepository,
  type DrizzleDatabaseExecutor,
} from '@/shared/database/drizzle/drizzle-repository'

import type { FormalizationSignatureProxyBindingsRepository } from '@hms/core/formalization/interfaces'
import type { FormalizationSignatureProxyBinding } from '@hms/core/formalization/domain/entities'
import { DrizzleFormalizationSignatureProxyBindingMapper } from '@/formalization/database/drizzle/mappers'
import { formalizationSignatureProxyBindingModel } from '@/formalization/database/drizzle/models'
import {
  encodeSignatureHash,
  encodeSignaturePayload,
} from '@/formalization/database/drizzle/signature-binary'
import { mapSignatureChanges } from './signature-repository-utils'

@Injectable()
export class DrizzleFormalizationSignatureProxyBindingsRepository
  extends DrizzleRepository
  implements FormalizationSignatureProxyBindingsRepository
{
  constructor(
    drizzle: DrizzleClient,
    private readonly mapper: DrizzleFormalizationSignatureProxyBindingMapper,
    @Optional() databaseOverride?: DrizzleDatabaseExecutor,
  ) {
    super(drizzle, databaseOverride)
  }
  withDatabase(database: DrizzleDatabaseExecutor) {
    return new DrizzleFormalizationSignatureProxyBindingsRepository(
      this.drizzleClient,
      this.mapper,
      database,
    )
  }
  async add(binding: FormalizationSignatureProxyBinding) {
    await this.database.insert(formalizationSignatureProxyBindingModel).values({
      ...binding,
      aliasHash: encodeSignatureHash(binding.aliasHash),
      encryptedProviderCredential: encodeSignaturePayload(
        binding.encryptedProviderCredential,
      ),
    })
  }
  async findByAliasHash(aliasHash: string) {
    const [row] = await this.database
      .select()
      .from(formalizationSignatureProxyBindingModel)
      .where(
        eq(
          formalizationSignatureProxyBindingModel.aliasHash,
          encodeSignatureHash(aliasHash),
        ),
      )
      .limit(1)
    return row ? this.mapper.toDomain(row) : null
  }
  async findActiveByRecipientId(recipientId: string) {
    const rows = await this.database
      .select()
      .from(formalizationSignatureProxyBindingModel)
      .where(
        and(
          eq(formalizationSignatureProxyBindingModel.recipientId, recipientId),
          eq(formalizationSignatureProxyBindingModel.status, 'active'),
        ),
      )
    return rows.map((row) => this.mapper.toDomain(row))
  }
  async replace(input: { bindingId: string; expectedAliasHash?: string; changes: any }) {
    const [row] = await this.database
      .update(formalizationSignatureProxyBindingModel)
      .set({
        ...mapSignatureChanges(input.changes),
        ...(input.changes.aliasHash
          ? { aliasHash: encodeSignatureHash(input.changes.aliasHash) }
          : {}),
      })
      .where(
        and(
          eq(formalizationSignatureProxyBindingModel.id, input.bindingId),
          ...(input.expectedAliasHash
            ? [
                eq(
                  formalizationSignatureProxyBindingModel.aliasHash,
                  encodeSignatureHash(input.expectedAliasHash),
                ),
              ]
            : []),
        ),
      )
      .returning()
    return !!row
  }
}
