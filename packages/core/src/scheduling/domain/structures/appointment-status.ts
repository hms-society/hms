export const AppointmentStatus = {
  Scheduled: 'scheduled',
  Cancelled: 'cancelled',
} as const

export type AppointmentStatus = (typeof AppointmentStatus)[keyof typeof AppointmentStatus]
