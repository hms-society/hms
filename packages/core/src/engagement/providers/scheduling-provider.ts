export type DateRange = {
  start: Date
  end: Date
}

export type Slot = {
  start: Date
  end: Date
}

export type ReserveSlotInput = {
  lawyerId: string
  personId: string
  startsAt: Date
  durationInMinutes: number
}

export interface SchedulingProvider {
  listAvailableSlots(
    lawyerId: string,
    dateRange: DateRange,
    duration: number,
  ): Promise<Slot[]>
  reserveSlot(input: ReserveSlotInput): Promise<{ appointmentId: string }>
  cancelAppointment(appointmentId: string): Promise<void>
  rescheduleAppointment(
    appointmentId: string,
    newDateTime: Date,
  ): Promise<{ appointmentId: string }>
}
