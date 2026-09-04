import { Injectable, Optional } from '@nestjs/common'
import { and, asc, eq } from 'drizzle-orm'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import {
  DrizzleRepository,
  type DrizzleDatabaseExecutor,
} from '@/shared/database/drizzle/drizzle-repository'

import type { FormalizationSignatureOtpSendAttemptsRepository } from '@hms/core/formalization/interfaces'
import type { FormalizationSignatureOtpSendAttempt } from '@hms/core/formalization/domain/entities'
import { DrizzleFormalizationSignatureOtpSendAttemptMapper } from '@/formalization/database/drizzle/mappers'
import { formalizationSignatureOtpSendAttemptModel } from '@/formalization/database/drizzle/models'
import { encodeSignaturePayload } from '@/formalization/database/drizzle/signature-binary'
import { dueSignatureWork, mapSignatureChanges } from './signature-repository-utils'

@Injectable()
export class DrizzleFormalizationSignatureOtpSendAttemptsRepository
  extends DrizzleRepository
  implements FormalizationSignatureOtpSendAttemptsRepository
{
  constructor(
    drizzle: DrizzleClient,
    private readonly mapper: DrizzleFormalizationSignatureOtpSendAttemptMapper,
    @Optional() databaseOverride?: DrizzleDatabaseExecutor,
  ) {
    super(drizzle, databaseOverride)
  }
  withDatabase(database: DrizzleDatabaseExecutor) {
    return new DrizzleFormalizationSignatureOtpSendAttemptsRepository(
      this.drizzleClient,
      this.mapper,
      database,
    )
  }
  async add(attempt: FormalizationSignatureOtpSendAttempt) {
    await this.database.insert(formalizationSignatureOtpSendAttemptModel).values({
      ...attempt,
      encryptedPayload: encodeSignaturePayload(attempt.encryptedPayload),
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }
  async findById(attemptId: string) {
    return this.findOne(eq(formalizationSignatureOtpSendAttemptModel.id, attemptId))
  }

  async findPending(now: Date, limit: number) {
    const rows = await this.database
      .select()
      .from(formalizationSignatureOtpSendAttemptModel)
      .where(
        and(
          eq(formalizationSignatureOtpSendAttemptModel.status, 'pending'),
          dueSignatureWork(formalizationSignatureOtpSendAttemptModel.nextAttemptAt, now),
        ),
      )
      .orderBy(asc(formalizationSignatureOtpSendAttemptModel.nextAttemptAt))
      .limit(limit)
    return rows.map((row) => this.mapper.toDomain(row))
  }
  async replace(input: { attemptId: string; changes: any }) {
    await this.database
      .update(formalizationSignatureOtpSendAttemptModel)
      .set({ ...mapSignatureChanges(input.changes), updatedAt: new Date() })
      .where(eq(formalizationSignatureOtpSendAttemptModel.id, input.attemptId))
  }
  private async findOne(condition: any) {
    const [row] = await this.database
      .select()
      .from(formalizationSignatureOtpSendAttemptModel)
      .where(condition)
      .limit(1)
    return row ? this.mapper.toDomain(row) : null
  }
}
