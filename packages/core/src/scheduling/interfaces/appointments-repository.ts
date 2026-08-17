import type { Appointment } from '../domain/entities'

export interface AppointmentsRepository {
  add(appointment: Appointment): Promise<Appointment>
  addMany(appointments: readonly Appointment[]): Promise<readonly Appointment[]>
  removeAll(): Promise<void>
  findByIntakeId(intakeId: string): Promise<Appointment | undefined>
  findOverlapping(
    scheduleId: string,
    startsAt: Date,
    endsAt: Date,
  ): Promise<Appointment | undefined>
}
