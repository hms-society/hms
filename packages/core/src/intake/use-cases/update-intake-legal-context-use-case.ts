import type { UseCase } from '#shared/interfaces/use-case'

import type { Intake } from '../domain/entities'
import {
  IntakeNotFoundError,
  IntakeVersionConflictError,
  InvalidIntakeUpdateError,
} from '../domain/errors'
import { IntakeStatus } from '../domain/structures'
import type { IntakesRepository } from '../interfaces/intakes-repository'

export type UpdateIntakeLegalContextRequest = {
  readonly intakeId: string
  readonly legalAreaId: string
  readonly legalTopicId: string
  readonly updatedBy: string
}

export class UpdateIntakeLegalContextUseCase
  implements UseCase<UpdateIntakeLegalContextRequest, Intake>
{
  constructor(private readonly intakesRepository: IntakesRepository) {}

  async execute(request: UpdateIntakeLegalContextRequest): Promise<Intake> {
    const intake = await this.intakesRepository.findById(request.intakeId)
    if (!intake) throw new IntakeNotFoundError()

    if (
      intake.status === IntakeStatus.Contracted ||
      intake.status === IntakeStatus.ClosedWithoutContract
    ) {
      throw new InvalidIntakeUpdateError(
        'Intakes em estado terminal não podem ser editados.',
      )
    }

    if (
      intake.legalAreaId === request.legalAreaId &&
      intake.legalTopicId === request.legalTopicId
    ) {
      return intake
    }

    const updatedIntake = await this.intakesRepository.replace({
      intakeId: request.intakeId,
      expectedVersion: intake.version,
      changes: {
        legalAreaId: request.legalAreaId,
        legalTopicId: request.legalTopicId,
        updatedBy: request.updatedBy,
      },
    })

    if (!updatedIntake) throw new IntakeVersionConflictError()
    return updatedIntake
  }
}
