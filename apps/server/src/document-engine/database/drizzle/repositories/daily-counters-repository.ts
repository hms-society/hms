import { Injectable } from '@nestjs/common'
import { sql } from 'drizzle-orm'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'
import type { DailyCountersRepository } from '@hms/core/document-engine/interfaces'
import { dailyCounterModel } from '../models/daily-counter-model'

@Injectable()
export class DrizzleDailyCountersRepository
  extends DrizzleRepository
  implements DailyCountersRepository
{
  async incrementAndGet(context: string, date: string): Promise<number> {
    const [record] = await this.database
      .insert(dailyCounterModel)
      .values({ context, date, count: 1 })
      .onConflictDoUpdate({
        target: [dailyCounterModel.context, dailyCounterModel.date],
        set: { count: sql`${dailyCounterModel.count} + 1` },
      })
      .returning()

    return record.count
  }
}
