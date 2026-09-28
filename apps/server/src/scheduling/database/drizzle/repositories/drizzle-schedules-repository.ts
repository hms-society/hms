import { Inject, Injectable } from '@nestjs/common'
import { and, asc, eq, gte, inArray, lte } from 'drizzle-orm'
import type { BlockedPeriod, Schedule } from '@hms/core/scheduling/domain/entities'
import type {
  CalendarDate,
  WeeklyAvailability,
} from '@hms/core/scheduling/domain/structures'
import type {
  CreateBlockedPeriodInput,
  CreateScheduleInput,
  SchedulesRepository,
} from '@hms/core/scheduling/interfaces'

import { DRIZZLE } from '@/shared/database/drizzle/database.provider'
import { blockedPeriods, schedules } from '@/shared/database/drizzle/schema/scheduling'
import type { SchedulingDatabaseExecutor } from '@/scheduling/database/drizzle/repositories/scheduling-database-executor'

type ScheduleRecord = typeof schedules.$inferSelect & {
  blockedPeriods: readonly (typeof blockedPeriods.$inferSelect)[]
}

@Injectable()
export class DrizzleSchedulesRepository implements SchedulesRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: SchedulingDatabaseExecutor,
  ) {}

  withDatabase(database: SchedulingDatabaseExecutor) {
    return new DrizzleSchedulesRepository(database)
  }

  async addMany(schedulesToAdd: readonly Schedule[]) {
    if (schedulesToAdd.length === 0) return []

    const records = await this.db
      .insert(schedules)
      .values(
        schedulesToAdd.map((schedule) => ({
          id: schedule.id,
          collaboratorId: schedule.collaboratorId,
          defaultDurationMinutes: schedule.appointmentDurationInMinutes,
          weeklyAvailability: schedule.weeklyAvailability,
          timeZone: schedule.timeZone,
          createdAt: schedule.createdAt,
          updatedAt: schedule.updatedAt,
        })),
      )
      .returning()

    return records.map((record) =>
      this.mapToScheduleDomain({ ...record, blockedPeriods: [] }),
    )
  }

  async removeAll() {
    await this.db.delete(blockedPeriods)
    await this.db.delete(schedules)
  }

  async findById(id: string): Promise<Schedule | null> {
    const [scheduleRow] = await this.db
      .select()
      .from(schedules)
      .where(eq(schedules.id, id))

    if (!scheduleRow) return null

    return this.loadSchedule(scheduleRow)
  }

  async findByIdForUpdate(id: string): Promise<Schedule | null> {
    const [scheduleRow] = await this.db
      .select()
      .from(schedules)
      .where(eq(schedules.id, id))
      .for('update')

    if (!scheduleRow) return null

    return this.loadSchedule(scheduleRow)
  }

  async findByCollaboratorId(collaboratorId: string): Promise<Schedule | null> {
    const [scheduleRow] = await this.db
      .select()
      .from(schedules)
      .where(eq(schedules.collaboratorId, collaboratorId))

    if (!scheduleRow) return null

    return this.loadSchedule(scheduleRow)
  }

  async findByCollaboratorIdForUpdate(collaboratorId: string): Promise<Schedule | null> {
    const [scheduleRow] = await this.db
      .select()
      .from(schedules)
      .where(eq(schedules.collaboratorId, collaboratorId))
      .for('update')

    if (!scheduleRow) return null

    return this.loadSchedule(scheduleRow)
  }

  async listByCollaboratorIds(ids?: readonly string[]): Promise<readonly Schedule[]> {
    if (ids?.length === 0) return []

    const scheduleRows = await this.db
      .select()
      .from(schedules)
      .where(ids ? inArray(schedules.collaboratorId, [...ids]) : undefined)
      .orderBy(asc(schedules.collaboratorId), asc(schedules.id))

    if (scheduleRows.length === 0) return []

    const scheduleIds = scheduleRows.map((schedule) => schedule.id)
    const blockedRows = await this.db
      .select()
      .from(blockedPeriods)
      .where(inArray(blockedPeriods.scheduleId, scheduleIds))
    const blockedByScheduleId = new Map<string, (typeof blockedRows)[number][]>()

    for (const blockedPeriod of blockedRows) {
      const periods = blockedByScheduleId.get(blockedPeriod.scheduleId) ?? []
      periods.push(blockedPeriod)
      blockedByScheduleId.set(blockedPeriod.scheduleId, periods)
    }

    return scheduleRows.map((schedule) =>
      this.mapToScheduleDomain({
        ...schedule,
        blockedPeriods: blockedByScheduleId.get(schedule.id) ?? [],
      }),
    )
  }

  async listBlockedPeriods(
    scheduleIds: readonly string[],
    startsOn: CalendarDate,
    endsOn: CalendarDate,
  ): Promise<readonly (BlockedPeriod & { scheduleId: string })[]> {
    if (scheduleIds.length === 0) return []

    const startDate = new Date(`${startsOn}T00:00:00.000Z`)
    const endDate = new Date(`${endsOn}T23:59:59.999Z`)
    const rows = await this.db
      .select()
      .from(blockedPeriods)
      .where(
        and(
          inArray(blockedPeriods.scheduleId, [...scheduleIds]),
          lte(blockedPeriods.startDate, endDate),
          gte(blockedPeriods.endDate, startDate),
        ),
      )

    return rows.map((row) => ({
      ...this.mapBlockedPeriod(row),
      scheduleId: row.scheduleId,
    }))
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

    return results.map((item) => this.mapBlockedPeriod(item))
  }

  async deleteBlockedPeriod(id: string): Promise<void> {
    await this.db.delete(blockedPeriods).where(eq(blockedPeriods.id, id))
  }

  async updateWeeklyAvailability(scheduleId: string, weeklyAvailability: unknown) {
    const [updated] = await this.db
      .update(schedules)
      .set({ weeklyAvailability, updatedAt: new Date() })
      .where(eq(schedules.id, scheduleId))
      .returning()

    return updated
      ? this.mapToScheduleDomain({ ...updated, blockedPeriods: [] })
      : undefined
  }

  async updateDefaultDuration(scheduleId: string, defaultDurationMinutes: number) {
    const [updated] = await this.db
      .update(schedules)
      .set({ defaultDurationMinutes, updatedAt: new Date() })
      .where(eq(schedules.id, scheduleId))
      .returning()

    return updated
      ? this.mapToScheduleDomain({ ...updated, blockedPeriods: [] })
      : undefined
  }

  async createBlockedPeriod(data: CreateBlockedPeriodInput): Promise<BlockedPeriod> {
    const [created] = await this.db
      .insert(blockedPeriods)
      .values({
        scheduleId: data.scheduleId,
        startDate: new Date(`${data.startsOn}T00:00:00.000Z`),
        endDate: new Date(`${data.endsOn}T23:59:59.999Z`),
        description: data.reason ?? '',
      })
      .returning()

    return this.mapBlockedPeriod(created)
  }

  private async loadSchedule(scheduleRow: typeof schedules.$inferSelect) {
    const blocked = await this.db
      .select()
      .from(blockedPeriods)
      .where(eq(blockedPeriods.scheduleId, scheduleRow.id))
    return this.mapToScheduleDomain({ ...scheduleRow, blockedPeriods: blocked })
  }

  private mapToScheduleDomain(schedule: ScheduleRecord): Schedule {
    return {
      id: schedule.id,
      collaboratorId: schedule.collaboratorId,
      timeZone: schedule.timeZone,
      appointmentDurationInMinutes: schedule.defaultDurationMinutes,
      weeklyAvailability: (schedule.weeklyAvailability ?? []) as WeeklyAvailability[],
      blockedPeriods: schedule.blockedPeriods.map((blockedPeriod) =>
        this.mapBlockedPeriod(blockedPeriod),
      ),
      createdAt: schedule.createdAt,
      updatedAt: schedule.updatedAt,
    }
  }

  private mapBlockedPeriod(item: typeof blockedPeriods.$inferSelect): BlockedPeriod {
    return {
      id: item.id,
      startsOn: this.toCalendarDate(item.startDate),
      endsOn: this.toCalendarDate(item.endDate),
      reason: item.description ?? '',
      createdAt: item.createdAt,
    }
  }

  private toCalendarDate(date: Date | string | null | undefined): CalendarDate {
    if (!date) return '' as CalendarDate
    if (typeof date === 'string') return date.split('T')[0].split(' ')[0] as CalendarDate
    if (Number.isNaN(date.getTime())) return '' as CalendarDate

    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const day = String(date.getUTCDate()).padStart(2, '0')
    return `${year}-${month}-${day}` as CalendarDate
  }
}
