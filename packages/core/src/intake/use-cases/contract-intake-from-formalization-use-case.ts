import type { UseCase } from '../../shared/interfaces'
import type { Intake } from '../domain/entities'
import {
  IntakeNotFoundError,
  IntakeVersionConflictError,
  InvalidIntakeTransitionError,
} from '../domain/errors'
import { IntakeStatus } from '../domain/structures'
import type { IntakesRepository } from '../interfaces/intakes-repository'

export type ContractIntakeRequest = {
  readonly intakeId: string
  readonly expectedVersion: number
  readonly contractedAt: Date
  readonly updatedBy: string
}

export class ContractIntakeFromFormalizationUseCase
  implements UseCase<ContractIntakeRequest, Intake>
{
  constructor(private readonly intakesRepository: IntakesRepository) {}

  async execute(request: ContractIntakeRequest): Promise<Intake> {
    const intake = await this.intakesRepository.findById(request.intakeId)
    if (!intake) throw new IntakeNotFoundError()

    if (intake.status !== IntakeStatus.InFormalization) {
      throw new InvalidIntakeTransitionError(intake.status, IntakeStatus.Contracted)
    }

    const contractedAt = new Date(request.contractedAt.getTime())
    if (!Number.isFinite(contractedAt.getTime())) {
      throw new InvalidIntakeTransitionError(intake.status, IntakeStatus.Contracted)
    }

    const updatedIntake = await this.intakesRepository.replace({
      intakeId: request.intakeId,
      expectedVersion: request.expectedVersion,
      changes: {
        status: IntakeStatus.Contracted,
        contractedAt,
        updatedBy: request.updatedBy,
      },
    })
    if (!updatedIntake) throw new IntakeVersionConflictError()
    return updatedIntake
  }
}
