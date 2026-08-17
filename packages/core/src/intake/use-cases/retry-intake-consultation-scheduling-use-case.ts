import type {
  ConsultationChannel,
  ConsultationModality,
} from '#consultation/domain/structures'
import type { Broker, DatetimeProvider, UseCase } from '#shared/interfaces'

import type { Intake } from '../domain/entities'
import {
  IntakeNotFoundError,
  IntakeVersionConflictError,
  InvalidIntakeTransitionError,
} from '../domain/errors'
import { IntakeConsultationSchedulingRequestedEvent } from '../domain/events'
import { IntakeStatus } from '../domain/structures'
import type { IntakesRepository } from '../interfaces'

type Request = {
  intakeId: string
  assignedLawyerId: string
  startsAt: Date
  modality: ConsultationModality
  channel?: ConsultationChannel
  requestedBy: string
}

export class RetryIntakeConsultationSchedulingUseCase
  implements UseCase<Request, Intake>
{
  constructor(
    private readonly intakesRepository: IntakesRepository,
    private readonly datetimeProvider: DatetimeProvider,
    private readonly broker: Broker,
  ) {}

  async execute(request: Request): Promise<Intake> {
    const intake = await this.intakesRepository.findById(request.intakeId)

    if (!intake) {
      throw new IntakeNotFoundError()
    }

    if (intake.status !== IntakeStatus.ConsultationSchedulingFailed) {
      throw new InvalidIntakeTransitionError(
        intake.status,
        IntakeStatus.ConsultationScheduling,
      )
    }

    const retriedIntake = await this.intakesRepository.replace({
      intakeId: intake.id,
      expectedVersion: intake.version,
      changes: {
        status: IntakeStatus.ConsultationScheduling,
        updatedBy: request.requestedBy,
      },
    })

    if (!retriedIntake) {
      throw new IntakeVersionConflictError()
    }

    await this.broker.publish(
      new IntakeConsultationSchedulingRequestedEvent({
        intakeId: retriedIntake.id,
        clientId: retriedIntake.clientId,
        assignedLawyerId: request.assignedLawyerId,
        legalAreaId: retriedIntake.legalAreaId,
        legalTopicId: retriedIntake.legalTopicId,
        demandNotes: retriedIntake.demandNotes,
        startsAt: request.startsAt,
        modality: request.modality,
        channel: request.channel,
        requestedBy: request.requestedBy,
        occurredAt: this.datetimeProvider.now(),
      }),
    )

    return retriedIntake
  }
}
