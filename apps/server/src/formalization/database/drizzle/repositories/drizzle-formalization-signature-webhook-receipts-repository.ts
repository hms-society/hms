import { Injectable, Optional } from '@nestjs/common'
import { and, asc, eq } from 'drizzle-orm'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import {
  DrizzleRepository,
  type DrizzleDatabaseExecutor,
} from '@/shared/database/drizzle/drizzle-repository'

import type { FormalizationSignatureWebhookReceiptsRepository } from '@hms/core/formalization/interfaces'
import type { FormalizationSignatureWebhookReceipt } from '@hms/core/formalization/domain/entities'
import { DrizzleFormalizationSignatureWebhookReceiptMapper } from '@/formalization/database/drizzle/mappers'
import { formalizationSignatureWebhookReceiptModel } from '@/formalization/database/drizzle/models'
import {
  encodeSignatureHash,
  encodeSignaturePayload,
} from '@/formalization/database/drizzle/signature-binary'
import { dueSignatureWork, mapSignatureChanges } from './signature-repository-utils'

@Injectable()
export class DrizzleFormalizationSignatureWebhookReceiptsRepository
  extends DrizzleRepository
  implements FormalizationSignatureWebhookReceiptsRepository
{
  constructor(
    drizzle: DrizzleClient,
    private readonly mapper: DrizzleFormalizationSignatureWebhookReceiptMapper,
    @Optional() databaseOverride?: DrizzleDatabaseExecutor,
  ) {
    super(drizzle, databaseOverride)
  }
  withDatabase(database: DrizzleDatabaseExecutor) {
    return new DrizzleFormalizationSignatureWebhookReceiptsRepository(
      this.drizzleClient,
      this.mapper,
      database,
    )
  }
  async add(receipt: FormalizationSignatureWebhookReceipt) {
    await this.database.insert(formalizationSignatureWebhookReceiptModel).values({
      ...receipt,
      dedupeKey: encodeSignatureHash(receipt.dedupeKey),
      encryptedHint: encodeSignaturePayload(receipt.encryptedHint),
    })
  }
  async findByDedupeKey(dedupeKey: string) {
    const [row] = await this.database
      .select()
      .from(formalizationSignatureWebhookReceiptModel)
      .where(
        eq(
          formalizationSignatureWebhookReceiptModel.dedupeKey,
          encodeSignatureHash(dedupeKey),
        ),
      )
      .limit(1)
    return row ? this.mapper.toDomain(row) : null
  }
  async findById(receiptId: string) {
    const [row] = await this.database
      .select()
      .from(formalizationSignatureWebhookReceiptModel)
      .where(eq(formalizationSignatureWebhookReceiptModel.id, receiptId))
      .limit(1)
    return row ? this.mapper.toDomain(row) : null
  }
  async findPending(now: Date, limit: number) {
    const rows = await this.database
      .select()
      .from(formalizationSignatureWebhookReceiptModel)
      .where(
        and(
          eq(formalizationSignatureWebhookReceiptModel.status, 'pending'),
          dueSignatureWork(formalizationSignatureWebhookReceiptModel.nextAttemptAt, now),
        ),
      )
      .orderBy(asc(formalizationSignatureWebhookReceiptModel.nextAttemptAt))
      .limit(limit)
    return rows.map((row) => this.mapper.toDomain(row))
  }
  async replace(input: { receiptId: string; changes: any }) {
    await this.database
      .update(formalizationSignatureWebhookReceiptModel)
      .set({
        ...mapSignatureChanges(input.changes),
        ...(input.changes.encryptedHint
          ? { encryptedHint: encodeSignaturePayload(input.changes.encryptedHint) }
          : {}),
      })
      .where(eq(formalizationSignatureWebhookReceiptModel.id, input.receiptId))
  }
}
