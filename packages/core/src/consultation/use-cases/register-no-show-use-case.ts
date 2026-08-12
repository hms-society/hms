import { ConsultationStatus } from '../domain/structures'
import type { Consultation } from '../domain/entities'
import type { ConsultationsRepository } from '../interfaces/consultations-repository'

export class RegisterNoShowUseCase {
  constructor(private readonly consultationsRepository: ConsultationsRepository) {}

  async execute(consultationId: string): Promise<Consultation> {
    const consultation = await this.consultationsRepository.findById(consultationId)

    if (!consultation) {
      throw new Error('Consulta não encontrada.')
    }

    if (consultation.status !== ConsultationStatus.Pending) {
      throw new Error('Não comparecimento só pode ser registrado em consultas pendentes.')
    }

    const now = new Date()

    const noShowConsultation: Consultation = {
      ...consultation,
      status: ConsultationStatus.NoShow,
      noShowAt: now,
      updatedAt: now,
    } as Consultation

    await this.consultationsRepository.save(noShowConsultation)
    return noShowConsultation
  }
}
