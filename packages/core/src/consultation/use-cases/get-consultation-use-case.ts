import type { ConsultationDetails } from '../domain/entities'
import { ConsultationNotFoundError } from '../domain/errors'
import type { ConsultationsRepository } from '../interfaces'
import type {
  ClientsRepository,
  CollaboratorsRepository,
} from '../../identity/interfaces'
import type { IntakesRepository } from '../../intake/interfaces'
import type { AppointmentsRepository } from '../../scheduling/interfaces'
import type { UseCase } from '#shared/interfaces/use-case'

export type GetConsultationRequest = {
  readonly consultationId: string
}

export class GetConsultationUseCase
  implements UseCase<GetConsultationRequest, ConsultationDetails>
{
  constructor(
    private readonly consultationsRepository: ConsultationsRepository,
    private readonly intakesRepository: IntakesRepository,
    private readonly clientsRepository: ClientsRepository,
    private readonly collaboratorsRepository: CollaboratorsRepository,
    private readonly appointmentsRepository: AppointmentsRepository,
  ) {}

  async execute({
    consultationId,
  }: GetConsultationRequest): Promise<ConsultationDetails> {
    const consultation = await this.consultationsRepository.findById(consultationId)

    if (!consultation) {
      throw new ConsultationNotFoundError()
    }

    const [intake, client, assignedLawyer, appointment] = await Promise.all([
      this.intakesRepository.findById(consultation.intakeId),
      this.clientsRepository.findById(consultation.clientId),
      this.collaboratorsRepository.findSummaryById(consultation.assignedLawyerId),
      this.appointmentsRepository.findByIntakeId(consultation.intakeId),
    ])
    const responsible = intake
      ? await this.collaboratorsRepository.findSummaryById(intake.responsibleId)
      : undefined

    return {
      ...consultation,
      intake,
      client,
      responsible,
      assignedLawyer,
      appointment,
    }
  }
}
