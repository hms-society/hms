import { Injectable } from '@nestjs/common'
import type { ConsultationOutboxEvent } from '@hms/core/consultation/domain/entities'
import type { ConsultationOutboxRepository } from '@hms/core/consultation/interfaces'
import { and, asc, eq, isNull } from 'drizzle-orm'

import { DrizzleConsultationOutboxEventMapper } from '@/consultation/database/drizzle/mappers'
import { consultationOutboxEventModel } from '@/consultation/database/drizzle/models'
import { DatabaseTransactionContext } from '@/shared/database/drizzle/database-transaction-context'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'

@Injectable()
export class DrizzleConsultationOutboxRepository implements ConsultationOutboxRepository {
  constructor(
    private readonly drizzleClient: DrizzleClient,
    private readonly mapper: DrizzleConsultationOutboxEventMapper,
    private readonly transactionContext: DatabaseTransactionContext,
  ) {}

  private get executor() {
    return this.transactionContext.get() ?? this.drizzleClient.requireDatabase()
  }

  async add(event: ConsultationOutboxEvent) {
    const [record] = await this.executor
      .insert(consultationOutboxEventModel)
      .values({
        id: event.id,
        consultationId: event.consultationId,
        name: event.name,
        payload: event.payload,
        occurredAt: event.occurredAt,
        publishedAt: event.publishedAt ?? null,
      })
      .onConflictDoNothing({ target: consultationOutboxEventModel.id })
      .returning()

    if (record) return this.mapper.toDomain(record)

    const [existing] = await this.executor
      .select()
      .from(consultationOutboxEventModel)
      .where(eq(consultationOutboxEventModel.id, event.id))
      .limit(1)

    return existing ? this.mapper.toDomain(existing) : event
  }

  async listPending(limit: number) {
    const records = await this.executor
      .select()
      .from(consultationOutboxEventModel)
      .where(isNull(consultationOutboxEventModel.publishedAt))
      .orderBy(
        asc(consultationOutboxEventModel.occurredAt),
        asc(consultationOutboxEventModel.id),
      )
      .limit(limit)

    return records.map((record) => this.mapper.toDomain(record))
  }

  async markPublished(id: string, publishedAt: Date) {
    const [record] = await this.executor
      .update(consultationOutboxEventModel)
      .set({ publishedAt })
      .where(
        and(
          eq(consultationOutboxEventModel.id, id),
          isNull(consultationOutboxEventModel.publishedAt),
        ),
      )
      .returning({ id: consultationOutboxEventModel.id })

    return Boolean(record)
  }
}
