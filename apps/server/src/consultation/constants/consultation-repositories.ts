export const CONSULTATION_REPOSITORIES = {
  consultations: Symbol('CONSULTATION_REPOSITORIES.consultations'),
  calendarProvider: Symbol('CONSULTATION_REPOSITORIES.calendarProvider'),
  outbox: Symbol('CONSULTATION_REPOSITORIES.outbox'),
  rescheduledAppointmentProvider: Symbol(
    'CONSULTATION_REPOSITORIES.rescheduledAppointmentProvider',
  ),
} as const
