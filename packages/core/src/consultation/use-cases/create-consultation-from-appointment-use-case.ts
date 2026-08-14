import { ConsultationStatus, ConsultationModality } from '../domain/structures'
import type { Consultation } from '../domain/entities'
import type { ConsultationsRepository } from '../interfaces/consultations-repository'

export class CreateConsultationDto {
  id!: string
  appointmentId!: string
  clientId!: string
  assignedLawyerId!: string
  legalAreaId!: string
  legalTopicId!: string
  modality!: ConsultationModality
  channel?: string
}

export class CreateConsultationUseCase {
  constructor(private readonly consultationsRepository: ConsultationsRepository) {}

  async execute(input: CreateConsultationDto): Promise<Consultation> {
    const existing = await this.consultationsRepository.findByAppointmentId(
      input.appointmentId,
    )

    if (existing) {
      return existing
    }

    const now = new Date()

    const consultation: Consultation = {
      id: input.id,
      appointmentId: input.appointmentId,
      clientId: input.clientId,
      assignedLawyerId: input.assignedLawyerId,
      legalAreaId: input.legalAreaId,
      legalTopicId: input.legalTopicId,
      status: ConsultationStatus.Pending,
      modality: input.modality,
      ...(input.modality === ConsultationModality.Virtual && input.channel
        ? { channel: input.channel as any }
        : {}),
      relevantFacts: [],
      potentialLegalRequests: [],
      identifiedRisks: [],
      suggestions: [],
      createdAt: now,
      updatedAt: now,
    } as Consultation

    await this.consultationsRepository.save(consultation)
    return consultation
  }
}
