export interface AppointmentWriteTransactionProvider {
  runWithLockedAppointment<Result>(
    appointmentId: string,
    operation: (
      appointment: {
        appointmentId: string
        status: 'scheduled' | 'cancelled'
      } | undefined,
    ) => Promise<Result>,
  ): Promise<Result>
}
