import { Injectable, Optional } from '@nestjs/common'
import { and, asc, eq } from 'drizzle-orm'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import {
  DrizzleRepository,
  type DrizzleDatabaseExecutor,
} from '@/shared/database/drizzle/drizzle-repository'

import type { FormalizationSignatureRecipientsRepository } from '@hms/core/formalization/interfaces'
import type { FormalizationSignatureRecipient } from '@hms/core/formalization/domain/entities'
import { DrizzleFormalizationSignatureRecipientMapper } from '@/formalization/database/drizzle/mappers'
import { formalizationSignatureRecipientModel } from '@/formalization/database/drizzle/models'
import { encodeSignatureHash } from '@/formalization/database/drizzle/signature-binary'
import {
  mapSignatureChanges,
  withNextSignatureVersion,
} from './signature-repository-utils'

@Injectable()
export class DrizzleFormalizationSignatureRecipientsRepository
  extends DrizzleRepository
  implements FormalizationSignatureRecipientsRepository
{
  constructor(
    drizzle: DrizzleClient,
    private readonly mapper: DrizzleFormalizationSignatureRecipientMapper,
    @Optional() databaseOverride?: DrizzleDatabaseExecutor,
  ) {
    super(drizzle, databaseOverride)
  }
  withDatabase(database: DrizzleDatabaseExecutor) {
    return new DrizzleFormalizationSignatureRecipientsRepository(
      this.drizzleClient,
      this.mapper,
      database,
    )
  }
  async addMany(recipients: readonly FormalizationSignatureRecipient[]) {
    if (recipients.length === 0) return []
    const rows = await this.database
      .insert(formalizationSignatureRecipientModel)
      .values(
        recipients.map((recipient) => ({
          ...recipient,
          submissionObservationId: recipient.submissionObservationId
            ? encodeSignatureHash(recipient.submissionObservationId)
            : null,
        })),
      )
      .returning()
    return rows.map((row) => this.mapper.toDomain(row))
  }
  async findById(recipientId: string) {
    const [row] = await this.database
      .select()
      .from(formalizationSignatureRecipientModel)
      .where(eq(formalizationSignatureRecipientModel.id, recipientId))
      .limit(1)
    return row ? this.mapper.toDomain(row) : null
  }
  async listByRequestId(requestId: string) {
    const rows = await this.database
      .select()
      .from(formalizationSignatureRecipientModel)
      .where(eq(formalizationSignatureRecipientModel.requestId, requestId))
      .orderBy(asc(formalizationSignatureRecipientModel.createdAt))
    return rows.map((row) => this.mapper.toDomain(row))
  }
  async replace(input: { recipientId: string; expectedVersion: number; changes: any }) {
    const [row] = await this.database
      .update(formalizationSignatureRecipientModel)
      .set({
        ...mapSignatureChanges(input.changes),
        ...(input.changes.submissionObservationId
          ? {
              submissionObservationId: encodeSignatureHash(
                input.changes.submissionObservationId,
              ),
            }
          : {}),
        updatedAt: new Date(),
        version: withNextSignatureVersion(formalizationSignatureRecipientModel.version),
      })
      .where(
        and(
          eq(formalizationSignatureRecipientModel.id, input.recipientId),
          eq(formalizationSignatureRecipientModel.version, input.expectedVersion),
        ),
      )
      .returning()
    return row ? !!this.mapper.toDomain(row) : false
  }
}
