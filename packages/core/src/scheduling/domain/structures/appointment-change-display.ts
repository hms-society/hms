import type { AppointmentChange } from '../entities/appointment-change'

export type AppointmentChangeDisplay = AppointmentChange & {
  actorName: string
}
