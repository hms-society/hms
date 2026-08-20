import type { ConsultationDetails } from '../domain/entities'
import { ConsultationNotFoundError } from '../domain/errors'
import type { ConsultationsRepository } from '../interfaces'
import type {
  ClientsRepository,
  CollaboratorsRepository,
} from '../../identity/interfaces'
import type { IntakesRepository } from '../../intake/interfaces'
import type { AppointmentsRepository } from '../../scheduling/interfaces'
import { GetConsultationUseCase } from './get-consultation-use-case'

export type GetConsultationByIntakeRequest = {
  readonly intakeId: string
}

export class GetConsultationByIntakeUseCase {
  private readonly getConsultation: GetConsultationUseCase

  constructor(
    private readonly consultationsRepository: ConsultationsRepository,
    intakesRepository: IntakesRepository,
    clientsRepository: ClientsRepository,
    collaboratorsRepository: CollaboratorsRepository,
    appointmentsRepository: AppointmentsRepository,
  ) {
    this.getConsultation = new GetConsultationUseCase(
      consultationsRepository,
      intakesRepository,
      clientsRepository,
      collaboratorsRepository,
      appointmentsRepository,
    )
  }

  async execute({
    intakeId,
  }: GetConsultationByIntakeRequest): Promise<ConsultationDetails> {
    const consultation = await this.consultationsRepository.findByIntakeId(intakeId)

    if (!consultation) {
      throw new ConsultationNotFoundError()
    }

    return this.getConsultation.execute({ consultationId: consultation.id })
  }
}
