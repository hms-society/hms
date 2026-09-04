import { Injectable, Optional } from '@nestjs/common'
import { and, asc, eq, isNull, lte, or } from 'drizzle-orm'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import {
  DrizzleRepository,
  type DrizzleDatabaseExecutor,
} from '@/shared/database/drizzle/drizzle-repository'

import type { FormalizationSignatureProvisioningAttemptsRepository } from '@hms/core/formalization/interfaces'
import type { FormalizationSignatureProvisioningAttempt } from '@hms/core/formalization/domain/entities'
import { DrizzleFormalizationSignatureProvisioningAttemptMapper } from '@/formalization/database/drizzle/mappers'
import { formalizationSignatureProvisioningAttemptModel } from '@/formalization/database/drizzle/models'
import { mapSignatureChanges } from './signature-repository-utils'

@Injectable()
export class DrizzleFormalizationSignatureProvisioningAttemptsRepository
  extends DrizzleRepository
  implements FormalizationSignatureProvisioningAttemptsRepository
{
  constructor(
    drizzle: DrizzleClient,
    private readonly mapper: DrizzleFormalizationSignatureProvisioningAttemptMapper,
    @Optional() databaseOverride?: DrizzleDatabaseExecutor,
  ) {
    super(drizzle, databaseOverride)
  }
  withDatabase(database: DrizzleDatabaseExecutor) {
    return new DrizzleFormalizationSignatureProvisioningAttemptsRepository(
      this.drizzleClient,
      this.mapper,
      database,
    )
  }
  async add(provisioning: FormalizationSignatureProvisioningAttempt) {
    await this.database
      .insert(formalizationSignatureProvisioningAttemptModel)
      .values(provisioning)
  }
  async findByRequestId(requestId: string) {
    const [row] = await this.database
      .select()
      .from(formalizationSignatureProvisioningAttemptModel)
      .where(eq(formalizationSignatureProvisioningAttemptModel.requestId, requestId))
      .limit(1)
    return row ? this.mapper.toDomain(row) : null
  }
  async findPending(now: Date, limit: number) {
    const rows = await this.database
      .select()
      .from(formalizationSignatureProvisioningAttemptModel)
      .where(
        and(
          eq(formalizationSignatureProvisioningAttemptModel.status, 'pending'),
          or(
            lte(formalizationSignatureProvisioningAttemptModel.nextAttemptAt, now),
            isNull(formalizationSignatureProvisioningAttemptModel.nextAttemptAt),
          ),
        ),
      )
      .orderBy(asc(formalizationSignatureProvisioningAttemptModel.nextAttemptAt))
      .limit(limit)
    return rows.map((row) => this.mapper.toDomain(row))
  }
  async replace(input: { attemptId: string; changes: any }) {
    await this.database
      .update(formalizationSignatureProvisioningAttemptModel)
      .set(mapSignatureChanges(input.changes))
      .where(eq(formalizationSignatureProvisioningAttemptModel.id, input.attemptId))
  }
}
