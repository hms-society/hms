import { Injectable, Optional } from '@nestjs/common'
import { and, asc, eq } from 'drizzle-orm'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import {
  DrizzleRepository,
  type DrizzleDatabaseExecutor,
} from '@/shared/database/drizzle/drizzle-repository'

import type { FormalizationSignatureInvitationSendAttemptsRepository } from '@hms/core/formalization/interfaces'
import type { FormalizationSignatureInvitationSendAttempt } from '@hms/core/formalization/domain/entities'
import { DrizzleFormalizationSignatureInvitationSendAttemptMapper } from '@/formalization/database/drizzle/mappers'
import { formalizationSignatureInvitationSendAttemptModel } from '@/formalization/database/drizzle/models'
import { encodeSignaturePayload } from '@/formalization/database/drizzle/signature-binary'
import { dueSignatureWork, mapSignatureChanges } from './signature-repository-utils'

@Injectable()
export class DrizzleFormalizationSignatureInvitationSendAttemptsRepository
  extends DrizzleRepository
  implements FormalizationSignatureInvitationSendAttemptsRepository
{
  constructor(
    drizzle: DrizzleClient,
    private readonly mapper: DrizzleFormalizationSignatureInvitationSendAttemptMapper,
    @Optional() databaseOverride?: DrizzleDatabaseExecutor,
  ) {
    super(drizzle, databaseOverride)
  }
  withDatabase(database: DrizzleDatabaseExecutor) {
    return new DrizzleFormalizationSignatureInvitationSendAttemptsRepository(
      this.drizzleClient,
      this.mapper,
      database,
    )
  }
  async add(attempt: FormalizationSignatureInvitationSendAttempt) {
    await this.database.insert(formalizationSignatureInvitationSendAttemptModel).values({
      ...attempt,
      encryptedPayload: encodeSignaturePayload(attempt.encryptedPayload),
    })
  }
  async findById(attemptId: string) {
    return this.findOne(
      eq(formalizationSignatureInvitationSendAttemptModel.id, attemptId),
    )
  }
  async findByInvitationId(invitationId: string) {
    return this.findOne(
      eq(formalizationSignatureInvitationSendAttemptModel.invitationId, invitationId),
    )
  }
  async findPending(now: Date, limit: number) {
    const rows = await this.database
      .select()
      .from(formalizationSignatureInvitationSendAttemptModel)
      .where(
        and(
          eq(formalizationSignatureInvitationSendAttemptModel.status, 'pending'),
          dueSignatureWork(
            formalizationSignatureInvitationSendAttemptModel.nextAttemptAt,
            now,
          ),
        ),
      )
      .orderBy(asc(formalizationSignatureInvitationSendAttemptModel.nextAttemptAt))
      .limit(limit)
    return rows.map((row) => this.mapper.toDomain(row))
  }
  async replace(input: { attemptId: string; changes: any }) {
    await this.database
      .update(formalizationSignatureInvitationSendAttemptModel)
      .set({ ...mapSignatureChanges(input.changes), updatedAt: new Date() })
      .where(eq(formalizationSignatureInvitationSendAttemptModel.id, input.attemptId))
  }
  private async findOne(condition: any) {
    const [row] = await this.database
      .select()
      .from(formalizationSignatureInvitationSendAttemptModel)
      .where(condition)
      .limit(1)
    return row ? this.mapper.toDomain(row) : null
  }
}
