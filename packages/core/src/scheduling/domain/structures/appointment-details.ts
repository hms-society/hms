import type { CalendarAppointment } from './calendar-appointment'
import type { AppointmentChangeDisplay } from './appointment-change-display'

export type AppointmentDetails = CalendarAppointment & {
  changes: AppointmentChangeDisplay[]
}
