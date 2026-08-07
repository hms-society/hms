import type { Consultation } from '../domain/entities'
import type { ConsultationsRepository } from '../interfaces/consultations-repository'

export class GetConsultationByIdUseCase {
  constructor(private readonly consultationsRepository: ConsultationsRepository) {}

  async execute(consultationId: string): Promise<Consultation | null> {
    const consultation = await this.consultationsRepository.findById(consultationId)
    if (!consultation) {
      throw new Error('Consulta não encontrada.')
    }
    return consultation
  }
}