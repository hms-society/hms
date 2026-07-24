export type ReserveAppointmentInput = {
  readonly scheduleId: string
  readonly clientId: string
  readonly startsAt: Date
  readonly durationInMinutes: number
}
