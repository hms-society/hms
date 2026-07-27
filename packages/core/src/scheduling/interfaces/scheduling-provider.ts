import type {
  AvailableSlot,
  ListAvailableSlotsInput,
  RescheduleAppointmentInput,
  ReserveAppointmentInput,
} from '../domain/structures'

export interface SchedulingProvider {
  listAvailableSlots(input: ListAvailableSlotsInput): Promise<AvailableSlot[]>
  reserveAppointment(input: ReserveAppointmentInput): Promise<{ appointmentId: string }>
  cancelAppointment(appointmentId: string): Promise<void>
  rescheduleAppointment(
    input: RescheduleAppointmentInput,
  ): Promise<{ appointmentId: string }>
}
