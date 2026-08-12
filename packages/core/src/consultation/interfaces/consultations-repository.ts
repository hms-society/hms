import type { Consultation } from '../domain/entities'

export interface ConsultationsRepository {
  add(consultation: Consultation): Promise<Consultation>
  addMany(consultations: readonly Consultation[]): Promise<readonly Consultation[]>
  findById(consultationId: string): Promise<Consultation | undefined>
  findByIntakeId(intakeId: string): Promise<Consultation | undefined>
  removeAll(): Promise<void>
}
