import { Injectable, Optional } from '@nestjs/common'
import { and, asc, eq } from 'drizzle-orm'
import type { FormalizationSignatureDocumentAcknowledgement } from '@hms/core/formalization/domain/entities'
import type { FormalizationSignatureDocumentAcknowledgementsRepository } from '@hms/core/formalization/interfaces'

import { DrizzleFormalizationSignatureDocumentAcknowledgementMapper } from '@/formalization/database/drizzle/mappers'
import { formalizationSignatureDocumentAcknowledgementModel } from '@/formalization/database/drizzle/models'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import {
  DrizzleRepository,
  type DrizzleDatabaseExecutor,
} from '@/shared/database/drizzle/drizzle-repository'

@Injectable()
export class DrizzleFormalizationSignatureDocumentAcknowledgementsRepository
  extends DrizzleRepository
  implements FormalizationSignatureDocumentAcknowledgementsRepository
{
  constructor(
    drizzle: DrizzleClient,
    private readonly mapper: DrizzleFormalizationSignatureDocumentAcknowledgementMapper,
    @Optional() databaseOverride?: DrizzleDatabaseExecutor,
  ) {
    super(drizzle, databaseOverride)
  }

  withDatabase(database: DrizzleDatabaseExecutor) {
    return new DrizzleFormalizationSignatureDocumentAcknowledgementsRepository(
      this.drizzleClient,
      this.mapper,
      database,
    )
  }

  async add(acknowledgement: FormalizationSignatureDocumentAcknowledgement) {
    await this.database
      .insert(formalizationSignatureDocumentAcknowledgementModel)
      .values(this.mapper.toPersistence(acknowledgement))
      .onConflictDoNothing()
  }

  async findByRecipientDocumentAndSnapshot(input: {
    recipientId: string
    requestDocumentId: string
    snapshotId: string
  }) {
    const [row] = await this.database
      .select()
      .from(formalizationSignatureDocumentAcknowledgementModel)
      .where(
        and(
          eq(
            formalizationSignatureDocumentAcknowledgementModel.recipientId,
            input.recipientId,
          ),
          eq(
            formalizationSignatureDocumentAcknowledgementModel.requestDocumentId,
            input.requestDocumentId,
          ),
          eq(
            formalizationSignatureDocumentAcknowledgementModel.snapshotId,
            input.snapshotId,
          ),
        ),
      )
      .limit(1)
    return row ? this.mapper.toDomain(row) : null
  }

  async listByRecipientAndSnapshot(input: { recipientId: string; snapshotId: string }) {
    const rows = await this.database
      .select()
      .from(formalizationSignatureDocumentAcknowledgementModel)
      .where(
        and(
          eq(
            formalizationSignatureDocumentAcknowledgementModel.recipientId,
            input.recipientId,
          ),
          eq(
            formalizationSignatureDocumentAcknowledgementModel.snapshotId,
            input.snapshotId,
          ),
        ),
      )
      .orderBy(asc(formalizationSignatureDocumentAcknowledgementModel.acknowledgedAt))
    return rows.map((row) => this.mapper.toDomain(row))
  }
}
