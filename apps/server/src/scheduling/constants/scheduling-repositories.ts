export const SCHEDULING_REPOSITORIES = {
  schedules: Symbol('SCHEDULING_REPOSITORIES.schedules'),
  appointments: Symbol('SCHEDULING_REPOSITORIES.appointments'),
  database: Symbol('SCHEDULING_REPOSITORIES.database'),
  appointmentWriteTransactionProvider: Symbol(
    'SCHEDULING_REPOSITORIES.appointmentWriteTransactionProvider',
  ),
} as const
