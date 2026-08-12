import type { DatetimeProvider } from '#shared/interfaces/datetime-provider'
import type { Broker } from '#shared/interfaces/broker'
import type { UseCase } from '#shared/interfaces/use-case'
import type {
  ConsultationChannel,
  ConsultationModality,
} from '#consultation/domain/structures'

import type { Intake, IntakeCreation } from '../domain/entities'
import { InvalidIntakeClosureError } from '../domain/errors'
import {
  IntakeConsultationSchedulingRequestedEvent,
  IntakeCreatedEvent,
} from '../domain/events'
import {
  IntakeStatus,
  IntakeDecision,
  type IntakeClosureReason,
  type IntakeStatus as IntakeStatusValue,
} from '../domain/structures'
import type { IntakesRepository } from '../interfaces'

type BaseRequest = Omit<
  IntakeCreation,
  'closedAt' | 'closureNotes' | 'closureReason' | 'status'
>

type ScheduledRequest = BaseRequest & {
  decision: typeof IntakeDecision.ScheduleConsultation
  assignedLawyerId: string
  startsAt: Date
  modality: ConsultationModality
  channel?: ConsultationChannel
}

type RegisteredRequest = BaseRequest & {
  decision: typeof IntakeDecision.RegisterIntake
}

type ClosedRequest = BaseRequest & {
  decision: typeof IntakeDecision.CloseWithoutContract
  closureNotes?: string
  closureReason: IntakeClosureReason
}

type Request = RegisteredRequest | ScheduledRequest | ClosedRequest

export class RegisterIntakeUseCase implements UseCase<Request, Intake> {
  constructor(
    private readonly intakesRepository: IntakesRepository,
    private readonly datetimeProvider: DatetimeProvider,
    private readonly broker: Broker,
  ) {}

  async execute(request: Request): Promise<Intake> {
    const { decision } = request
    const intakeData: BaseRequest = {
      clientId: request.clientId,
      responsibleId: request.responsibleId,
      createdBy: request.createdBy,
      updatedBy: request.updatedBy,
      origin: request.origin,
      contactChannel: request.contactChannel,
      legalAreaId: request.legalAreaId,
      legalTopicId: request.legalTopicId,
      urgency: request.urgency,
      demandNotes: request.demandNotes,
    }

    if (
      decision === IntakeDecision.CloseWithoutContract &&
      request.closureReason === 'other' &&
      !request.closureNotes?.trim()
    ) {
      throw new InvalidIntakeClosureError(
        'Uma observação é obrigatória quando o motivo for outro.',
      )
    }

    const status: IntakeStatusValue =
      decision === IntakeDecision.ScheduleConsultation
        ? IntakeStatus.ConsultationScheduling
        : decision === IntakeDecision.RegisterIntake
          ? IntakeStatus.Registered
          : IntakeStatus.ClosedWithoutContract

    const intake: IntakeCreation = {
      ...intakeData,
      status,
      ...(decision === IntakeDecision.CloseWithoutContract
        ? {
            closedAt: this.datetimeProvider.now(),
            closureNotes: request.closureNotes?.trim() || undefined,
            closureReason: request.closureReason,
          }
        : {}),
    }

    const createdIntake = await this.intakesRepository.add(intake)

    const eventPayload = {
      intakeId: createdIntake.id,
      clientId: createdIntake.clientId,
      responsibleId: createdIntake.responsibleId,
      legalAreaId: createdIntake.legalAreaId,
      legalTopicId: createdIntake.legalTopicId,
      demandNotes: createdIntake.demandNotes,
      occurredAt: this.datetimeProvider.now(),
    }

    await this.broker.publish(
      new IntakeCreatedEvent({
        ...eventPayload,
        status: createdIntake.status,
      }),
    )

    if (decision === IntakeDecision.ScheduleConsultation) {
      await this.broker.publish(
        new IntakeConsultationSchedulingRequestedEvent({
          intakeId: createdIntake.id,
          clientId: createdIntake.clientId,
          assignedLawyerId: request.assignedLawyerId,
          legalAreaId: createdIntake.legalAreaId,
          legalTopicId: createdIntake.legalTopicId,
          demandNotes: createdIntake.demandNotes,
          startsAt: request.startsAt,
          modality: request.modality,
          channel: request.channel,
          requestedBy: createdIntake.updatedBy,
          occurredAt: this.datetimeProvider.now(),
        }),
      )
    }

    return createdIntake
  }
}
