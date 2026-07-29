export const AutomaticMessageKind = {
  AppointmentScheduled: 'appointment_scheduled',
  AppointmentRescheduled: 'appointment_rescheduled',
} as const

export type AutomaticMessageKind =
  (typeof AutomaticMessageKind)[keyof typeof AutomaticMessageKind]
