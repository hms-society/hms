import type { DatetimeProvider } from '#shared/interfaces/datetime-provider'
import type { UseCase } from '#shared/interfaces/use-case'

import type { Intake } from '../domain/entities'
import {
  IntakeNotFoundError,
  IntakeVersionConflictError,
  InvalidIntakeClosureError,
} from '../domain/errors'
import { IntakeStatus, type IntakeClosureReason } from '../domain/structures'
import type { IntakesRepository } from '../interfaces'

type Request = {
  intakeId: string
  expectedVersion: number
  closureReason: IntakeClosureReason
  closureNotes?: string
  updatedBy: string
}

export class CloseIntakeWithoutContractUseCase implements UseCase<Request, Intake> {
  constructor(
    private readonly intakesRepository: IntakesRepository,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

  async execute(request: Request): Promise<Intake> {
    const intake = await this.intakesRepository.findById(request.intakeId)

    if (!intake) {
      throw new IntakeNotFoundError()
    }

    if (intake.status === IntakeStatus.ClosedWithoutContract) {
      return intake
    }

    if (intake.status === IntakeStatus.Contracted) {
      throw new InvalidIntakeClosureError(
        'Um Intake contratado não pode ser encerrado sem contratação.',
      )
    }

    const closureNotes = request.closureNotes?.trim() || undefined

    const updatedIntake = await this.intakesRepository.replace({
      intakeId: request.intakeId,
      expectedVersion: request.expectedVersion,
      changes: {
        status: IntakeStatus.ClosedWithoutContract,
        closureReason: request.closureReason,
        closureNotes,
        closedAt: this.datetimeProvider.now(),
        updatedBy: request.updatedBy,
      },
    })

    if (!updatedIntake) {
      throw new IntakeVersionConflictError()
    }

    return updatedIntake
  }
}
