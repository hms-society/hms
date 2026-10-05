export interface RescheduledAppointmentConsultationProvider {
  syncLawyerForAppointment(appointmentId: string, lawyerId: string): Promise<void>
}
