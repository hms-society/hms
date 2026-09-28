export type CalendarAppointment = {
  kind: 'appointment'
  appointmentId: string
  scheduleId: string
  clientId: string
  clientName: string
  lawyerId: string
  lawyerName: string
  startsAt: Date
  endsAt: Date
  timeZone: string
  status: 'scheduled' | 'cancelled'
  cancelledAt?: Date
  consultationId?: string
  consultationStatus?: 'pending' | 'in_progress' | 'completed' | 'no_show'
  consultationStartedAt?: Date
  updatedAt: Date
}
