import type { Consultation } from '../domain/entities/consultation'

export interface ConsultationsRepository {
  findById(id: string): Promise<Consultation | null>
  findByAppointmentId(appointmentId: string): Promise<Consultation | null>
  save(consultation: Consultation): Promise<void>
}
