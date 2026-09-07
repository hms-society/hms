import type { UseCase } from '#shared/interfaces/use-case'

import type { Intake } from '../domain/entities'
import {
  IntakeNotFoundError,
  IntakeVersionConflictError,
  InvalidIntakeUpdateError,
} from '../domain/errors'
import { IntakeStatus } from '../domain/structures'
import type { ContactChannel, IntakeOrigin, IntakeUrgency } from '../domain/structures'
import type { IntakesRepository } from '../interfaces/intakes-repository'

type Request = {
  intakeId: string
  expectedVersion: number
  updatedBy: string
  responsibleId: string
  origin: IntakeOrigin
  contactChannel: ContactChannel
  legalAreaId?: string | null
  legalTopicId?: string | null
  urgency: IntakeUrgency
  demandNotes?: string
}

export class UpdateIntakeUseCase implements UseCase<Request, Intake> {
  constructor(private readonly intakesRepository: IntakesRepository) {}

  async execute(request: Request): Promise<Intake> {
    const intake = await this.intakesRepository.findById(request.intakeId)

    if (!intake) {
      throw new IntakeNotFoundError()
    }

    if (
      intake.status === IntakeStatus.Contracted ||
      intake.status === IntakeStatus.ClosedWithoutContract
    ) {
      throw new InvalidIntakeUpdateError(
        'Intakes em estado terminal não podem ser editados.',
      )
    }

    const updatedIntake = await this.intakesRepository.replace({
      intakeId: request.intakeId,
      expectedVersion: request.expectedVersion,
      changes: {
        responsibleId: request.responsibleId,
        origin: request.origin,
        contactChannel: request.contactChannel,
        legalAreaId: request.legalAreaId,
        legalTopicId: request.legalTopicId,
        urgency: request.urgency,
        demandNotes: request.demandNotes?.trim() || null,
        updatedBy: request.updatedBy,
      },
    })

    if (!updatedIntake) {
      throw new IntakeVersionConflictError()
    }

    return updatedIntake
  }
}
