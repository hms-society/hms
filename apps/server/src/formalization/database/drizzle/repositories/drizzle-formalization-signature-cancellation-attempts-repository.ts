import { Injectable, Optional } from '@nestjs/common'
import { and, asc, eq, isNull, lte, or } from 'drizzle-orm'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import {
  DrizzleRepository,
  type DrizzleDatabaseExecutor,
} from '@/shared/database/drizzle/drizzle-repository'

import type { FormalizationSignatureCancellationAttemptsRepository } from '@hms/core/formalization/interfaces'
import type { FormalizationSignatureCancellationAttempt } from '@hms/core/formalization/domain/entities'
import { DrizzleFormalizationSignatureCancellationAttemptMapper } from '@/formalization/database/drizzle/mappers'
import { formalizationSignatureCancellationAttemptModel } from '@/formalization/database/drizzle/models'
import { mapSignatureChanges } from './signature-repository-utils'

@Injectable()
export class DrizzleFormalizationSignatureCancellationAttemptsRepository
  extends DrizzleRepository
  implements FormalizationSignatureCancellationAttemptsRepository
{
  constructor(
    drizzle: DrizzleClient,
    private readonly mapper: DrizzleFormalizationSignatureCancellationAttemptMapper,
    @Optional() databaseOverride?: DrizzleDatabaseExecutor,
  ) {
    super(drizzle, databaseOverride)
  }
  withDatabase(database: DrizzleDatabaseExecutor) {
    return new DrizzleFormalizationSignatureCancellationAttemptsRepository(
      this.drizzleClient,
      this.mapper,
      database,
    )
  }
  async addMany(cancellations: readonly FormalizationSignatureCancellationAttempt[]) {
    if (cancellations.length === 0) return []
    const rows = await this.database
      .insert(formalizationSignatureCancellationAttemptModel)
      .values([...cancellations])
      .returning()
    return rows.map((row) => this.mapper.toDomain(row))
  }
  async add(cancellation: FormalizationSignatureCancellationAttempt) {
    await this.database
      .insert(formalizationSignatureCancellationAttemptModel)
      .values(cancellation)
  }
  async findById(attemptId: string) {
    const [row] = await this.database
      .select()
      .from(formalizationSignatureCancellationAttemptModel)
      .where(eq(formalizationSignatureCancellationAttemptModel.id, attemptId))
      .limit(1)
    return row ? this.mapper.toDomain(row) : null
  }
  async findByRequestId(requestId: string) {
    const [row] = await this.database
      .select()
      .from(formalizationSignatureCancellationAttemptModel)
      .where(eq(formalizationSignatureCancellationAttemptModel.requestId, requestId))
      .limit(1)
    return row ? this.mapper.toDomain(row) : null
  }
  async findPending(now: Date, limit: number) {
    const rows = await this.database
      .select()
      .from(formalizationSignatureCancellationAttemptModel)
      .where(
        and(
          eq(formalizationSignatureCancellationAttemptModel.status, 'pending'),
          or(
            lte(formalizationSignatureCancellationAttemptModel.nextAttemptAt, now),
            isNull(formalizationSignatureCancellationAttemptModel.nextAttemptAt),
          ),
        ),
      )
      .orderBy(asc(formalizationSignatureCancellationAttemptModel.nextAttemptAt))
      .limit(limit)
    return rows.map((row) => this.mapper.toDomain(row))
  }
  async claim(input: {
    attemptId: string
    attemptToken: string
    now: Date
    leaseExpiresAt: Date
  }) {
    const [row] = await this.database
      .update(formalizationSignatureCancellationAttemptModel)
      .set({
        status: 'processing',
        leaseExpiresAt: input.leaseExpiresAt,
        updatedAt: input.now,
      })
      .where(
        and(
          eq(formalizationSignatureCancellationAttemptModel.id, input.attemptId),
          eq(
            formalizationSignatureCancellationAttemptModel.attemptToken,
            input.attemptToken,
          ),
          or(
            and(
              or(
                eq(formalizationSignatureCancellationAttemptModel.status, 'pending'),
                eq(formalizationSignatureCancellationAttemptModel.status, 'failed'),
              ),
              or(
                isNull(formalizationSignatureCancellationAttemptModel.nextAttemptAt),
                lte(
                  formalizationSignatureCancellationAttemptModel.nextAttemptAt,
                  input.now,
                ),
              ),
            ),
            and(
              eq(formalizationSignatureCancellationAttemptModel.status, 'processing'),
              lte(
                formalizationSignatureCancellationAttemptModel.leaseExpiresAt,
                input.now,
              ),
            ),
          ),
        ),
      )
      .returning()
    return row ? this.mapper.toDomain(row) : null
  }
  async replace(input: { attemptId: string; changes: any }) {
    await this.database
      .update(formalizationSignatureCancellationAttemptModel)
      .set(mapSignatureChanges(input.changes))
      .where(eq(formalizationSignatureCancellationAttemptModel.id, input.attemptId))
  }
}
