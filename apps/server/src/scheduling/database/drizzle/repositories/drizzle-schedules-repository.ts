import { Inject, Injectable } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import type {
  SchedulesRepository,
  CreateBlockedPeriodInput,
  CreateScheduleInput,
} from '@hms/core/scheduling/interfaces'
import type {
  CalendarDate,
  WeeklyAvailability,
} from '@hms/core/scheduling/domain/structures'
import type { BlockedPeriod, Schedule } from '@hms/core/scheduling/domain/entities'

import { DRIZZLE, type DrizzleDB } from '@/shared/database/drizzle/database.provider'
import { schedules, blockedPeriods } from '@/shared/database/drizzle/schema/scheduling'

@Injectable()
export class DrizzleSchedulesRepository implements SchedulesRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: DrizzleDB,
  ) {}

  private toCalendarDate(date: Date | string | null | undefined): CalendarDate {
    if (!date) return '' as CalendarDate

    if (typeof date === 'string') {
      if (date.includes('NaN')) return '' as CalendarDate
      return date.split('T')[0].split(' ')[0] as CalendarDate
    }

    if (date instanceof Date) {
      if (Number.isNaN(date.getTime())) return '' as CalendarDate
      const year = date.getUTCFullYear()
      const month = String(date.getUTCMonth() + 1).padStart(2, '0')
      const day = String(date.getUTCDate()).padStart(2, '0')
      return `${year}-${month}-${day}` as CalendarDate
    }

    return '' as CalendarDate
  }

  private mapToScheduleDomain(schedule: any): Schedule {
    return {
      id: schedule.id,
      collaboratorId: schedule.collaboratorId,
      timeZone: schedule.timeZone ?? 'America/Sao_Paulo',
      appointmentDurationInMinutes: schedule.defaultDurationMinutes,
      weeklyAvailability: (schedule.weeklyAvailability ?? []) as WeeklyAvailability[],
      blockedPeriods: (schedule.blockedPeriods ?? []).map((bp: any) => ({
        id: bp.id,
        startsOn: bp.startsOn ?? this.toCalendarDate(bp.startDate),
        endsOn: bp.endsOn ?? this.toCalendarDate(bp.endDate),
        reason: bp.reason ?? bp.description ?? '',
        createdAt: bp.createdAt,
      })),
      createdAt: schedule.createdAt,
      updatedAt: schedule.updatedAt,
    }
  }

  async findById(id: string): Promise<Schedule | null> {
    const [scheduleRow] = await this.db
      .select()
      .from(schedules)
      .where(eq(schedules.id, id))

    if (!scheduleRow) return null

    const blocked = await this.findBlockedPeriodsByScheduleId(id)

    return this.mapToScheduleDomain({
      ...scheduleRow,
      blockedPeriods: blocked,
    })
  }

  async findByCollaboratorId(collaboratorId: string): Promise<Schedule | null> {
    const [scheduleRow] = await this.db
      .select()
      .from(schedules)
      .where(eq(schedules.collaboratorId, collaboratorId))

    if (!scheduleRow) return null

    const blocked = await this.findBlockedPeriodsByScheduleId(scheduleRow.id)

    return this.mapToScheduleDomain({
      ...scheduleRow,
      blockedPeriods: blocked,
    })
  }

  async createSchedule(data: CreateScheduleInput) {
    const [schedule] = await this.db
      .insert(schedules)
      .values({
        collaboratorId: data.collaboratorId,
        defaultDurationMinutes: data.defaultDurationMinutes,
        weeklyAvailability: data.weeklyAvailability,
      })
      .returning()

    return schedule
  }

  async findBlockedPeriodsByScheduleId(scheduleId: string): Promise<BlockedPeriod[]> {
    const results = await this.db
      .select()
      .from(blockedPeriods)
      .where(eq(blockedPeriods.scheduleId, scheduleId))

    return results.map((item) => ({
      id: item.id,
      startsOn: this.toCalendarDate(item.startDate),
      endsOn: this.toCalendarDate(item.endDate),
      reason: item.description ?? '',
      createdAt: item.createdAt,
    }))
  }

  async deleteBlockedPeriod(id: string): Promise<void> {
    await this.db.delete(blockedPeriods).where(eq(blockedPeriods.id, id))
  }

  async updateWeeklyAvailability(scheduleId: string, weeklyAvailability: unknown) {
    const [updated] = await this.db
      .update(schedules)
      .set({
        weeklyAvailability,
        updatedAt: new Date(),
      })
      .where(eq(schedules.id, scheduleId))
      .returning()

    return updated
  }

  async updateDefaultDuration(scheduleId: string, defaultDurationMinutes: number) {
    const [updated] = await this.db
      .update(schedules)
      .set({
        defaultDurationMinutes,
        updatedAt: new Date(),
      })
      .where(eq(schedules.id, scheduleId))
      .returning()

    return updated
  }

  async createBlockedPeriod(data: CreateBlockedPeriodInput): Promise<BlockedPeriod> {
    const cleanStart = data.startsOn.includes('T')
      ? data.startsOn
      : `${data.startsOn}T00:00:00.000Z`

    const cleanEnd = data.endsOn.includes('T')
      ? data.endsOn
      : `${data.endsOn}T23:59:59.999Z`

    const startDate = new Date(cleanStart)
    const endDate = new Date(cleanEnd)

    const [created] = await this.db
      .insert(blockedPeriods)
      .values({
        scheduleId: data.scheduleId,
        startDate,
        endDate,
        description: data.reason ?? '',
      })
      .returning()

    return {
      id: created.id,
      startsOn: this.toCalendarDate(created.startDate),
      endsOn: this.toCalendarDate(created.endDate),
      reason: created.description ?? '',
      createdAt: created.createdAt,
    }
  }
}
