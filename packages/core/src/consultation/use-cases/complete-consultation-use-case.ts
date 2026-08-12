import { ConsultationStatus, ConsultationSuggestionStatus } from '../domain/structures'
import type { Consultation } from '../domain/entities'
import type { ConsultationsRepository } from '../interfaces/consultations-repository'

export interface CompleteConsultationInput {
  consultationId: string
  legalAreaId?: string | null
  legalTopicId?: string | null
  primaryLegalQuestion?: string | null
  guidanceProvided?: string | null
  notes?: string | null
  viability?: string | null
  decision?: string | null
  relevantFacts?: Array<{
    id?: string
    description: string
    date?: string | null
  }>
  potentialLegalRequests?: Array<{
    id?: string
    title: string
    summary?: string | null
  }>
}

export class CompleteConsultationUseCase {
  constructor(private readonly consultationsRepository: ConsultationsRepository) {}

  private parseValidDate(dateStr?: string | null): Date | null {
    if (!dateStr || dateStr === 'S/D' || dateStr.trim() === '') return null

    if (dateStr.includes('/')) {
      const parts = dateStr.split('/')
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10)
        const month = parseInt(parts[1], 10) - 1
        const year = parseInt(parts[2], 10)
        const parsed = new Date(year, month, day)
        return isNaN(parsed.getTime()) ? null : parsed
      }
    }

    const parsed = new Date(dateStr)
    return isNaN(parsed.getTime()) ? null : parsed
  }

  async execute(input: CompleteConsultationInput): Promise<Consultation> {
    const rawId = input.consultationId as any
    const consultationId =
      typeof rawId === 'object' ? rawId.id || rawId.consultationId : String(rawId)

    const consultation = await this.consultationsRepository.findById(consultationId)

    if (!consultation) {
      throw new Error('Consulta não encontrada.')
    }

    if (
      consultation.status !== ConsultationStatus.InProgress &&
      consultation.status !== ConsultationStatus.Pending
    ) {
      throw new Error('Apenas consultas em andamento ou pendentes podem ser concluídas.')
    }

    const primaryLegalQuestion =
      input.primaryLegalQuestion ?? consultation.primaryLegalQuestion
    const guidanceProvided = input.guidanceProvided ?? consultation.guidanceProvided

    if (!primaryLegalQuestion?.trim()) {
      throw new Error(
        'A questão jurídica principal é obrigatória para concluir a consulta.',
      )
    }

    if (!guidanceProvided?.trim()) {
      throw new Error(
        'A orientação prestada ao cliente é obrigatória para concluir a consulta.',
      )
    }

    const hasPendingSuggestions = consultation.suggestions.some(
      (s) => s.status === ConsultationSuggestionStatus.Pending,
    )

    if (hasPendingSuggestions) {
      throw new Error(
        'Todas as sugestões pendentes devem ser aceitas ou rejeitadas antes de concluir a consulta.',
      )
    }

    const now = new Date()

    const relevantFacts = input.relevantFacts
      ? input.relevantFacts.map((fact) => ({
          id: fact.id || crypto.randomUUID(),
          description: fact.description,
          occurredOn: this.parseValidDate(fact.date),
        }))
      : consultation.relevantFacts

    const potentialLegalRequests = input.potentialLegalRequests
      ? input.potentialLegalRequests.map((req) => ({
          id: req.id || crypto.randomUUID(),
          description: req.title,
          summary: req.summary || null,
        }))
      : consultation.potentialLegalRequests

    const completedConsultation = {
      ...consultation,
      status: ConsultationStatus.Completed,
      legalAreaId: input.legalAreaId ?? consultation.legalAreaId,
      legalTopicId: input.legalTopicId ?? consultation.legalTopicId,
      primaryLegalQuestion,
      guidanceProvided,
      notes: input.notes ?? consultation.notes,
      viability: input.viability ?? (consultation as any).viability ?? null,
      decision: input.decision ?? (consultation as any).decision ?? null,
      relevantFacts,
      potentialLegalRequests,
      startedAt: consultation.startedAt ?? now,
      completedAt: now,
      updatedAt: now,
    } as unknown as Consultation

    await this.consultationsRepository.save(completedConsultation)
    return completedConsultation
  }
}
