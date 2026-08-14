import { ConsultationStatus } from '../domain/structures'
import type { Consultation } from '../domain/entities'
import type { ConsultationsRepository } from '../interfaces/consultations-repository'

export class StartConsultationUseCase {
  constructor(private readonly consultationsRepository: ConsultationsRepository) {}

  async execute(consultationId: string): Promise<Consultation> {
    const consultation = await this.consultationsRepository.findById(consultationId)

    if (!consultation) {
      throw new Error('Consulta não encontrada.')
    }

    if (consultation.status !== ConsultationStatus.Pending) {
      throw new Error('Apenas consultas no estado pendente podem ser iniciadas.')
    }

    const now = new Date()

    const updatedConsultation: Consultation = {
      ...consultation,
      status: ConsultationStatus.InProgress,
      startedAt: now,
      updatedAt: now,
    } as Consultation

    await this.consultationsRepository.save(updatedConsultation)
    return updatedConsultation
  }
}
