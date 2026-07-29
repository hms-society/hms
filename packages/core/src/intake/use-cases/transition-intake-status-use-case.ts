import type { UseCase } from '#shared/interfaces/use-case'

import type { Intake } from '../domain/entities'
import {
  IntakeNotFoundError,
  IntakeVersionConflictError,
  InvalidIntakeTransitionError,
} from '../domain/errors'
import {
  IntakeStatus,
  type IntakeStatus as IntakeStatusValue,
} from '../domain/structures'
import type { IntakesRepository } from '../interfaces'

type Request = {
  intakeId: string
  expectedVersion: number
  status: IntakeStatusValue
  updatedBy: string
}

const transitions: Partial<Record<IntakeStatusValue, IntakeStatusValue>> = {
  [IntakeStatus.Registered]: IntakeStatus.ConsultationScheduled,
  [IntakeStatus.ConsultationScheduled]: IntakeStatus.ConsultationCompleted,
  [IntakeStatus.ConsultationCompleted]: IntakeStatus.ViabilityRegistered,
  [IntakeStatus.ViabilityRegistered]: IntakeStatus.InFormalization,
  [IntakeStatus.InFormalization]: IntakeStatus.Contracted,
}

export class TransitionIntakeStatusUseCase implements UseCase<Request, Intake> {
  constructor(private readonly intakesRepository: IntakesRepository) {}

  async execute(request: Request): Promise<Intake> {
    const intake = await this.intakesRepository.findById(request.intakeId)

    if (!intake) {
      throw new IntakeNotFoundError()
    }

    if (intake.status === request.status) {
      return intake
    }

    if (transitions[intake.status] !== request.status) {
      throw new InvalidIntakeTransitionError(intake.status, request.status)
    }

    const updatedIntake = await this.intakesRepository.replace({
      intakeId: request.intakeId,
      expectedVersion: request.expectedVersion,
      changes: {
        status: request.status,
        updatedBy: request.updatedBy,
      },
    })

    if (!updatedIntake) {
      throw new IntakeVersionConflictError()
    }

    return updatedIntake
  }
}
