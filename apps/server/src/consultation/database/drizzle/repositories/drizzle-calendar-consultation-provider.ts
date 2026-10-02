import { Injectable } from '@nestjs/common'
import type { CalendarConsultationProvider } from '@hms/core/shared/interfaces'
import { inArray } from 'drizzle-orm'

import { consultationModel } from '@/consultation/database/drizzle/models'
import { DatabaseTransactionContext } from '@/shared/database/drizzle/database-transaction-context'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'

@Injectable()
export class DrizzleCalendarConsultationProvider implements CalendarConsultationProvider {
  constructor(
    private readonly drizzleClient: DrizzleClient,
    private readonly transactionContext: DatabaseTransactionContext,
  ) {}

  async getByAppointmentIds(ids: readonly string[]) {
    if (ids.length === 0) return new Map()

    const executor = this.transactionContext.get() ?? this.drizzleClient.requireDatabase()
    const rows = await executor
      .select({
        id: consultationModel.id,
        appointmentId: consultationModel.appointmentId,
        status: consultationModel.status,
        startedAt: consultationModel.startedAt,
      })
      .from(consultationModel)
      .where(inArray(consultationModel.appointmentId, [...ids]))

    return new Map(
      rows.map((row) => [
        row.appointmentId,
        {
          id: row.id,
          status: row.status as 'pending' | 'in_progress' | 'completed' | 'no_show',
          startedAt: row.startedAt ?? undefined,
        },
      ]),
    )
  }
}
