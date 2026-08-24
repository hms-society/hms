import type { Entity } from '#shared/domain/entities/entity'
import type { AppointmentStatus } from '../structures'

export type Appointment = Entity & {
  intakeId: string
  scheduleId: string
  clientId: string
  startsAt: Date
  endsAt: Date
  status: AppointmentStatus
  cancelledAt?: Date
  createdAt: Date
  updatedAt: Date
}
