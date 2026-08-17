import type { AppointmentStatus } from '../structures'

export type Appointment = {
  id: string
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
