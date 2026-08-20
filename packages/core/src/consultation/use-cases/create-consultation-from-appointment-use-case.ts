import type { DatetimeProvider, IdProvider, UseCase } from '#shared/interfaces'

import type { Consultation } from '../domain/entities'
import { ConsultationModality, type ConsultationChannel } from '../domain/structures'
import type { ConsultationsRepository } from '../interfaces'

type BaseRequest = {
  intakeId: string
  appointmentId: string
  clientId: string
  assignedLawyerId: string
  legalAreaId?: string
  legalTopicId?: string
  demandNotes?: string
}

type Request =
  | (BaseRequest & {
      modality: typeof ConsultationModality.InPerson
      channel?: never
    })
  | (BaseRequest & {
      modality: typeof ConsultationModality.Virtual
      channel: ConsultationChannel
    })

type Response = Consultation | undefined

export class CreateConsultationFromAppointmentUseCase
  implements UseCase<Request, Response>
{
  constructor(
    private readonly consultationsRepository: ConsultationsRepository,
    private readonly idProvider: IdProvider,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

  async execute(request: Request): Promise<Response> {
    const existingConsultation = await this.consultationsRepository.findByIntakeId(
      request.intakeId,
    )

    if (existingConsultation) return existingConsultation

    const now = this.datetimeProvider.now()
    const consultationBase = {
      id: this.idProvider.generate(),
      intakeId: request.intakeId,
      appointmentId: request.appointmentId,
      clientId: request.clientId,
      assignedLawyerId: request.assignedLawyerId,
      legalAreaId: request.legalAreaId,
      legalTopicId: request.legalTopicId,
      notes: request.demandNotes,
      relevantFacts: [],
      potentialLegalRequests: [],
      identifiedRisks: [],
      suggestions: [],
      status: 'pending' as const,
      createdAt: now,
      updatedAt: now,
    }
    const consultation: Consultation =
      request.modality === ConsultationModality.Virtual
        ? {
            ...consultationBase,
            modality: ConsultationModality.Virtual,
            channel: request.channel,
          }
        : { ...consultationBase, modality: ConsultationModality.InPerson }

    return this.consultationsRepository.add(consultation)
  }
}
