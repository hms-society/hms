import { ConsultationStatus, ConsultationSuggestionStatus } from '../domain/structures'
import type { Consultation } from '../domain/entities'
import type { ConsultationsRepository } from '../interfaces/consultations-repository'

export class CompleteConsultationUseCase {
  constructor(private readonly consultationsRepository: ConsultationsRepository) {}

  async execute(consultationId: string): Promise<Consultation> {
    const consultation = await this.consultationsRepository.findById(consultationId)

    if (!consultation) {
      throw new Error('Consulta não encontrada.')
    }

    if (consultation.status !== ConsultationStatus.InProgress) {
      throw new Error('Apenas consultas em andamento podem ser concluídas.')
    }

    if (!consultation.primaryLegalQuestion?.trim()) {
      throw new Error('A questão jurídica principal é obrigatória para concluir a consulta.')
    }

    if (!consultation.guidanceProvided?.trim()) {
      throw new Error('A orientação prestada ao cliente é obrigatória para concluir a consulta.')
    }

    const hasPendingSuggestions = consultation.suggestions.some(
      (s) => s.status === ConsultationSuggestionStatus.Pending,
    )

    if (hasPendingSuggestions) {
      throw new Error('Todas as sugestões pendentes devem ser aceitas ou rejeitadas antes de concluir a consulta.')
    }

    const now = new Date()

    const completedConsultation: Consultation = {
      ...consultation,
      status: ConsultationStatus.Completed,
      primaryLegalQuestion: consultation.primaryLegalQuestion,
      guidanceProvided: consultation.guidanceProvided,
      startedAt: consultation.startedAt!,
      completedAt: now,
      updatedAt: now,
    } as Consultation

    await this.consultationsRepository.save(completedConsultation)
    return completedConsultation
  }
}