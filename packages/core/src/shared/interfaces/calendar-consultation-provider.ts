export interface CalendarConsultationProvider {
  getByAppointmentIds(ids: readonly string[]): Promise<
    ReadonlyMap<
      string,
      {
        id: string
        status: 'pending' | 'in_progress' | 'completed' | 'no_show'
        startedAt?: Date
      }
    >
  >
}
