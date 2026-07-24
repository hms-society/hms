import type { DatetimeProvider } from '#shared/interfaces/datetime-provider'
import type { UseCase } from '#shared/interfaces/use-case'

import type { Intake, IntakeCreation } from '../domain/entities'
import { InvalidIntakeClosureError } from '../domain/errors'
import type { IntakeClosureReason, IntakeStatus } from '../domain/structures'
import type { IntakesRepository } from '../interfaces'

type BaseRequest = Omit<
  IntakeCreation,
  'closedAt' | 'closureNotes' | 'closureReason' | 'status'
>

type ScheduledRequest = BaseRequest & {
  decision: 'schedule_consultation'
}

type RegisteredRequest = BaseRequest & {
  decision: 'register_intake'
}

type ClosedRequest = BaseRequest & {
  decision: 'close_without_contract'
  closureNotes?: string
  closureReason: IntakeClosureReason
}

type Request = RegisteredRequest | ScheduledRequest | ClosedRequest

export class RegisterIntakeUseCase implements UseCase<Request, Intake> {
  constructor(
    private readonly intakesRepository: IntakesRepository,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

  async execute(request: Request): Promise<Intake> {
    const { decision, ...intakeData } = request

    if (
      decision === 'close_without_contract' &&
      request.closureReason === 'outro' &&
      !request.closureNotes?.trim()
    ) {
      throw new InvalidIntakeClosureError(
        'Uma observação é obrigatória quando o motivo for outro.',
      )
    }

    const status: IntakeStatus =
      decision === 'schedule_consultation'
        ? 'consultation_scheduled'
        : decision === 'register_intake'
          ? 'registered'
          : 'closed_without_contract'

    const intake: IntakeCreation = {
      ...intakeData,
      status,
      ...(decision === 'close_without_contract'
        ? {
            closedAt: this.datetimeProvider.now(),
            closureNotes: request.closureNotes?.trim() || undefined,
            closureReason: request.closureReason,
          }
        : {}),
    }

    return this.intakesRepository.add(intake)
  }
}
