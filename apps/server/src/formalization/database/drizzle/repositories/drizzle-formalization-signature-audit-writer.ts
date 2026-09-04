import { Injectable, Optional } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import {
  DrizzleRepository,
  type DrizzleDatabaseExecutor,
} from '@/shared/database/drizzle/drizzle-repository'
import { DrizzleFormalizationSignatureAuditEntryMapper } from '@/formalization/database/drizzle/mappers'
import { formalizationSignatureAuditEntryModel } from '@/formalization/database/drizzle/models'
import type { FormalizationSignatureAuditWriter } from '@hms/core/formalization/interfaces'

@Injectable()
export class DrizzleFormalizationSignatureAuditWriter
  extends DrizzleRepository
  implements FormalizationSignatureAuditWriter
{
  constructor(
    drizzle: DrizzleClient,
    private readonly mapper: DrizzleFormalizationSignatureAuditEntryMapper,
    @Optional() databaseOverride?: DrizzleDatabaseExecutor,
  ) {
    super(drizzle, databaseOverride)
  }

  withDatabase(database: DrizzleDatabaseExecutor) {
    return new DrizzleFormalizationSignatureAuditWriter(
      this.drizzleClient,
      this.mapper,
      database,
    )
  }

  async add(input: Parameters<FormalizationSignatureAuditWriter['add']>[0]) {
    await this.database
      .insert(formalizationSignatureAuditEntryModel)
      .values(this.mapper.toPersistence({ ...input, id: randomUUID() }))
  }
}
