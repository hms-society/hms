import { Injectable, Optional } from '@nestjs/common'
import type { Appointment, AppointmentChange } from '@hms/core/scheduling/domain/entities'
import type { AppointmentsRepository } from '@hms/core/scheduling/interfaces'
import { AppError } from '@hms/core/shared/domain/errors'
import { and, asc, eq, gt, gte, inArray, isNull, lt, type SQL } from 'drizzle-orm'

import {
  DrizzleAppointmentChangeMapper,
  DrizzleAppointmentMapper,
} from '@/scheduling/database/drizzle/mappers'
import {
  appointmentChangeModel,
  appointmentModel,
} from '@/scheduling/database/drizzle/models'
import { schedules } from '@/shared/database/drizzle/schema/scheduling'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'
import type { SchedulingDatabaseExecutor } from '@/scheduling/database/drizzle/repositories/scheduling-database-executor'

@Injectable()
export class DrizzleAppointmentsRepository
  extends DrizzleRepository
  implements AppointmentsRepository
{
  constructor(
    drizzle: DrizzleClient,
    private readonly mapper: DrizzleAppointmentMapper,
    private readonly changeMapper: DrizzleAppointmentChangeMapper,
    @Optional() private readonly databaseOverride?: SchedulingDatabaseExecutor,
  ) {
    super(drizzle)
  }

  private get executor(): SchedulingDatabaseExecutor {
    return this.databaseOverride ?? this.database
  }

  withDatabase(database: SchedulingDatabaseExecutor) {
    return new DrizzleAppointmentsRepository(
      this.drizzleClient,
      this.mapper,
      this.changeMapper,
      database,
    )
  }

  async add(appointment: Appointment) {
    const [record] = await this.executor
      .insert(appointmentModel)
      .values(appointment)
      .onConflictDoNothing({ target: appointmentModel.intakeId })
      .returning()

    if (record) return this.mapper.toDomain(record)

    const existingAppointment = await this.findByIntakeId(appointment.intakeId)

    if (!existingAppointment) {
      throw new AppError(
        'The Appointment could not be persisted.',
        'Appointment Persistence Error',
      )
    }

    return existingAppointment
  }

  async addMany(appointments: readonly Appointment[]) {
    if (appointments.length === 0) return []

    const records = await this.executor
      .insert(appointmentModel)
      .values(appointments.map((appointment) => ({ ...appointment })))
      .returning()

    return records.map((record) => this.mapper.toDomain(record))
  }

  async removeAll() {
    await this.executor.delete(appointmentChangeModel)
    await this.executor.delete(appointmentModel)
  }

  async findByIntakeId(intakeId: string) {
    const [record] = await this.executor
      .select()
      .from(appointmentModel)
      .where(eq(appointmentModel.intakeId, intakeId))
      .limit(1)

    return record ? this.mapper.toDomain(record) : undefined
  }

  async findById(id: string) {
    const [record] = await this.executor
      .select()
      .from(appointmentModel)
      .where(eq(appointmentModel.id, id))
      .limit(1)

    return record ? this.mapper.toDomain(record) : undefined
  }

  async findByIdForUpdate(id: string) {
    const [record] = await this.executor
      .select()
      .from(appointmentModel)
      .where(eq(appointmentModel.id, id))
      .for('update')

    return record ? this.mapper.toDomain(record) : undefined
  }

  async findOverlapping(scheduleId: string, startsAt: Date, endsAt: Date) {
    const [record] = await this.executor
      .select()
      .from(appointmentModel)
      .where(
        and(
          eq(appointmentModel.scheduleId, scheduleId),
          eq(appointmentModel.status, 'scheduled'),
          lt(appointmentModel.startsAt, endsAt),
          gt(appointmentModel.endsAt, startsAt),
        ),
      )
      .limit(1)

    return record ? this.mapper.toDomain(record) : undefined
  }

  async listOverlapping(
    startsAt: Date,
    endsAt: Date,
    scheduleIds: readonly string[],
    clientId?: string,
  ) {
    if (scheduleIds.length === 0) return []

    const conditions = [
      inArray(appointmentModel.scheduleId, [...scheduleIds]),
      lt(appointmentModel.startsAt, endsAt),
      gt(appointmentModel.endsAt, startsAt),
      ...(clientId ? [eq(appointmentModel.clientId, clientId)] : []),
    ]

    const records = await this.executor
      .select()
      .from(appointmentModel)
      .where(and(...conditions))
      .orderBy(asc(appointmentModel.startsAt), asc(appointmentModel.id))

    return records.map((record) => this.mapper.toDomain(record))
  }

  async listChanges(appointmentId: string) {
    const records = await this.executor
      .select()
      .from(appointmentChangeModel)
      .where(eq(appointmentChangeModel.appointmentId, appointmentId))
      .orderBy(asc(appointmentChangeModel.occurredAt), asc(appointmentChangeModel.id))

    return records.map((record) => this.changeMapper.toDomain(record))
  }

  async addChange(change: AppointmentChange) {
    const [record] = await this.executor
      .insert(appointmentChangeModel)
      .values({
        ...change,
        previousScheduleId: change.previousScheduleId ?? null,
        newScheduleId: change.newScheduleId ?? null,
        newStartsAt: change.newStartsAt ?? null,
        newEndsAt: change.newEndsAt ?? null,
        publishedAt: change.publishedAt ?? null,
      })
      .onConflictDoNothing({
        target: [
          appointmentChangeModel.appointmentId,
          appointmentChangeModel.previousRevision,
          appointmentChangeModel.kind,
        ],
      })
      .returning()

    if (record) return this.changeMapper.toDomain(record)

    const [existing] = await this.executor
      .select()
      .from(appointmentChangeModel)
      .where(
        and(
          eq(appointmentChangeModel.appointmentId, change.appointmentId),
          eq(appointmentChangeModel.previousRevision, change.previousRevision),
          eq(appointmentChangeModel.kind, change.kind),
        ),
      )
      .limit(1)

    if (!existing) {
      throw new AppError(
        'The Appointment change could not be persisted.',
        'Appointment Change Persistence Error',
      )
    }

    return this.changeMapper.toDomain(existing)
  }

  async listPendingChanges(limit: number) {
    const records = await this.executor
      .select({ change: appointmentChangeModel, appointment: appointmentModel })
      .from(appointmentChangeModel)
      .innerJoin(
        appointmentModel,
        eq(appointmentModel.id, appointmentChangeModel.appointmentId),
      )
      .where(isNull(appointmentChangeModel.publishedAt))
      .orderBy(asc(appointmentChangeModel.occurredAt), asc(appointmentChangeModel.id))
      .limit(limit)

    return records.map(({ change, appointment }) => ({
      change: this.changeMapper.toDomain(change),
      appointment: this.mapper.toDomain(appointment),
    }))
  }

  async markChangePublished(id: string, publishedAt: Date): Promise<boolean> {
    const [record] = await this.executor
      .update(appointmentChangeModel)
      .set({ publishedAt })
      .where(
        and(
          eq(appointmentChangeModel.id, id),
          isNull(appointmentChangeModel.publishedAt),
        ),
      )
      .returning({ id: appointmentChangeModel.id })

    return Boolean(record)
  }

  async replaceIfRevisionMatches(
    appointmentId: string,
    expectedRevision: Date,
    changes: {
      scheduleId?: string
      startsAt?: Date
      endsAt?: Date
      status?: 'scheduled' | 'cancelled'
      cancelledAt?: Date
      updatedAt: Date
    },
  ) {
    const [record] = await this.executor
      .update(appointmentModel)
      .set({
        ...changes,
        cancelledAt: changes.cancelledAt ?? null,
      })
      .where(
        and(
          eq(appointmentModel.id, appointmentId),
          gte(appointmentModel.updatedAt, expectedRevision),
          lt(appointmentModel.updatedAt, new Date(expectedRevision.getTime() + 1)),
        ),
      )
      .returning()

    return record ? this.mapper.toDomain(record) : undefined
  }

  async listDistinctFacetIds(
    kind: 'client' | 'lawyer',
    scope: { scheduleIds?: readonly string[]; clientId?: string; lawyerId?: string },
    cursor: string | undefined,
    limit: number,
  ) {
    const conditions = this.buildFacetConditions(scope)
    if (scope.scheduleIds?.length === 0) return { ids: [], nextCursor: undefined }

    const records =
      kind === 'client'
        ? await this.executor
            .selectDistinct({ id: appointmentModel.clientId })
            .from(appointmentModel)
            .innerJoin(schedules, eq(schedules.id, appointmentModel.scheduleId))
            .where(this.withCursor(conditions, appointmentModel.clientId, cursor))
            .orderBy(asc(appointmentModel.clientId))
            .limit(limit)
        : await this.executor
            .selectDistinct({ id: schedules.collaboratorId })
            .from(appointmentModel)
            .innerJoin(schedules, eq(schedules.id, appointmentModel.scheduleId))
            .where(this.withCursor(conditions, schedules.collaboratorId, cursor))
            .orderBy(asc(schedules.collaboratorId))
            .limit(limit)

    const ids = records.map(({ id }) => id)
    return {
      ids,
      nextCursor: ids.length === limit ? ids[ids.length - 1] : undefined,
    }
  }

  async filterFacetIdsInScope(
    kind: 'client' | 'lawyer',
    scope: { scheduleIds?: readonly string[]; clientId?: string; lawyerId?: string },
    candidates: readonly string[],
  ) {
    if (candidates.length === 0 || scope.scheduleIds?.length === 0) return []

    const conditions = [
      ...this.buildFacetConditions(scope),
      kind === 'client'
        ? inArray(appointmentModel.clientId, [...candidates])
        : inArray(schedules.collaboratorId, [...candidates]),
    ]

    const records =
      kind === 'client'
        ? await this.executor
            .selectDistinct({ id: appointmentModel.clientId })
            .from(appointmentModel)
            .innerJoin(schedules, eq(schedules.id, appointmentModel.scheduleId))
            .where(and(...conditions))
        : await this.executor
            .selectDistinct({ id: schedules.collaboratorId })
            .from(appointmentModel)
            .innerJoin(schedules, eq(schedules.id, appointmentModel.scheduleId))
            .where(and(...conditions))

    return records.map(({ id }) => id)
  }

  private buildFacetConditions(scope: {
    scheduleIds?: readonly string[]
    clientId?: string
    lawyerId?: string
  }): SQL[] {
    return [
      ...(scope.scheduleIds?.length
        ? [inArray(appointmentModel.scheduleId, [...scope.scheduleIds])]
        : []),
      ...(scope.clientId ? [eq(appointmentModel.clientId, scope.clientId)] : []),
      ...(scope.lawyerId ? [eq(schedules.collaboratorId, scope.lawyerId)] : []),
    ]
  }

  private withCursor(
    conditions: SQL[],
    column: typeof appointmentModel.clientId | typeof schedules.collaboratorId,
    cursor: string | undefined,
  ) {
    return and(...conditions, ...(cursor ? [gt(column, cursor)] : []))
  }
}
