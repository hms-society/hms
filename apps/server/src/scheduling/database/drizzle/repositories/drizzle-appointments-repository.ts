import { Injectable } from '@nestjs/common'
import type { Appointment } from '@hms/core/scheduling/domain/entities'
import type { AppointmentsRepository } from '@hms/core/scheduling/interfaces'
import { AppError } from '@hms/core/shared/domain/errors'
import { and, eq, gt, lt } from 'drizzle-orm'

import { DrizzleAppointmentMapper } from '@/scheduling/database/drizzle/mappers'
import { appointmentModel } from '@/scheduling/database/drizzle/models'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'

@Injectable()
export class DrizzleAppointmentsRepository
  extends DrizzleRepository
  implements AppointmentsRepository
{
  constructor(
    drizzle: DrizzleClient,
    private readonly mapper: DrizzleAppointmentMapper,
  ) {
    super(drizzle)
  }

  async add(appointment: Appointment) {
    const [record] = await this.database
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

    const records = await this.database
      .insert(appointmentModel)
      .values(appointments.map((appointment) => ({ ...appointment })))
      .returning()

    return records.map((record) => this.mapper.toDomain(record))
  }

  async removeAll() {
    await this.database.delete(appointmentModel)
  }

  async findByIntakeId(intakeId: string) {
    const [record] = await this.database
      .select()
      .from(appointmentModel)
      .where(eq(appointmentModel.intakeId, intakeId))
      .limit(1)

    return record ? this.mapper.toDomain(record) : undefined
  }

  async findOverlapping(scheduleId: string, startsAt: Date, endsAt: Date) {
    const [record] = await this.database
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
}
