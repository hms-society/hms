import type { UseCase } from '#shared/interfaces/use-case'

import type { Intake } from '../domain/entities'
import {
  IntakeNotFoundError,
  IntakeVersionConflictError,
  InvalidIntakeTransitionError,
} from '../domain/errors'
import {
  IntakeConsultationSchedulingOutcome,
  type IntakeConsultationSchedulingOutcome as IntakeConsultationSchedulingOutcomeValue,
  IntakeStatus,
} from '../domain/structures'
import type { IntakesRepository } from '../interfaces/intakes-repository'

type Request = {
  intakeId: string
  outcome: IntakeConsultationSchedulingOutcomeValue
  updatedBy: string
}

export class ResolveIntakeConsultationSchedulingUseCase
  implements UseCase<Request, Intake>
{
  constructor(private readonly intakesRepository: IntakesRepository) {}

  async execute(request: Request): Promise<Intake> {
    const intake = await this.intakesRepository.findById(request.intakeId)

    if (!intake) {
      throw new IntakeNotFoundError()
    }

    const status =
      request.outcome === IntakeConsultationSchedulingOutcome.Scheduled
        ? IntakeStatus.ConsultationScheduled
        : IntakeStatus.ConsultationSchedulingFailed

    if (intake.status === status) return intake

    const isScheduling = intake.status === IntakeStatus.ConsultationScheduling
    const isSuccessfulRetry =
      intake.status === IntakeStatus.ConsultationSchedulingFailed &&
      request.outcome === IntakeConsultationSchedulingOutcome.Scheduled

    if (!isScheduling && !isSuccessfulRetry) {
      throw new InvalidIntakeTransitionError(intake.status, status)
    }

    const updatedIntake = await this.intakesRepository.replace({
      intakeId: intake.id,
      expectedVersion: intake.version,
      changes: {
        status,
        updatedBy: request.updatedBy,
      },
    })

    if (!updatedIntake) {
      throw new IntakeVersionConflictError()
    }

    return updatedIntake
  }
}
