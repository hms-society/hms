import type { UseCase } from '#shared/interfaces/use-case'

import type { Intake } from '../domain/entities'
import {
  IntakeNotFoundError,
  IntakeVersionConflictError,
  InvalidIntakeTransitionError,
} from '../domain/errors'
import { IntakeStatus } from '../domain/structures'
import type { IntakesRepository } from '../interfaces/intakes-repository'

type Request = {
  readonly intakeId: string
  readonly updatedBy: string
}

export class CompleteIntakeAfterConsultationUseCase implements UseCase<Request, Intake> {
  constructor(private readonly intakesRepository: IntakesRepository) {}

  async execute(request: Request): Promise<Intake> {
    const intake = await this.intakesRepository.findById(request.intakeId)
    if (!intake) throw new IntakeNotFoundError()

    if (intake.status === IntakeStatus.ConsultationCompleted) return intake

    if (intake.status !== IntakeStatus.ConsultationScheduled) {
      throw new InvalidIntakeTransitionError(
        intake.status,
        IntakeStatus.ConsultationCompleted,
      )
    }

    const updatedIntake = await this.intakesRepository.replace({
      intakeId: intake.id,
      expectedVersion: intake.version,
      changes: {
        status: IntakeStatus.ConsultationCompleted,
        updatedBy: request.updatedBy,
      },
    })

    if (!updatedIntake) throw new IntakeVersionConflictError()
    return updatedIntake
  }
}
