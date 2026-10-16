import type { DocumentPackagesRepository } from '../../document-production/interfaces'
import type {
  AppointmentWriteTransactionProvider,
  Broker,
  DatetimeProvider,
  IdProvider,
  UseCase,
} from '#shared/interfaces'
import {
  CollaboratorProfile,
  type CollaboratorProfile as CollaboratorProfileValue,
} from '../../identity/domain/structures'

import {
  ConsultationAppointmentCancelledError,
  ConsultationCompletionBlockedError,
  ConsultationNotFoundError,
} from '../domain/errors'
import { ConsultationCompletedEvent } from '../domain/events'
import { ConsultationStatus } from '../domain/structures'
import type { Consultation } from '../domain/entities'
import type { ConsultationOutboxRepository, ConsultationsRepository } from '../interfaces'

type Request = {
  readonly consultationId: string
  readonly collaboratorId: string
  readonly collaboratorProfile: CollaboratorProfileValue
}

export class CompleteConsultationUseCase implements UseCase<Request, Consultation> {
  constructor(
    private readonly consultationsRepository: ConsultationsRepository,
    _documentPackagesRepository: DocumentPackagesRepository,
    private readonly broker: Broker,
    private readonly datetimeProvider: DatetimeProvider,
    private readonly appointmentTransactionProvider?: AppointmentWriteTransactionProvider,
    private readonly outboxRepository?: ConsultationOutboxRepository,
    private readonly idProvider?: IdProvider,
  ) {}

  async execute(request: Request) {
    if (this.appointmentTransactionProvider) {
      return this.executeWithLockedAppointment(request)
    }

    const consultation = await this.consultationsRepository.findById(
      request.consultationId,
    )
    if (!consultation) throw new ConsultationNotFoundError()
    if (
      request.collaboratorProfile !== CollaboratorProfile.Admin &&
      consultation.assignedLawyerId !== request.collaboratorId
    ) {
      throw new ConsultationCompletionBlockedError(
        'Somente o advogado associado pode concluir a consulta.',
      )
    }
    if (consultation.status !== ConsultationStatus.Pending) {
      throw new ConsultationCompletionBlockedError(
        'Somente uma consulta pendente pode ser concluída.',
      )
    }
    if (!consultation.attendanceFinalizedAt) {
      throw new ConsultationCompletionBlockedError(
        'Finalize a ficha de atendimento primeiro.',
      )
    }

    const completedAt = this.datetimeProvider.now()
    const completed = await this.consultationsRepository.replace(request.consultationId, {
      status: ConsultationStatus.Completed,
      completedAt,
    })
    if (!completed) throw new ConsultationNotFoundError()

    await this.broker.publish(
      new ConsultationCompletedEvent({
        consultationId: completed.id,
        intakeId: completed.intakeId,
        completedBy: request.collaboratorId,
        occurredAt: completedAt,
      }),
    )

    return completed
  }

  private async executeWithLockedAppointment(request: Request): Promise<Consultation> {
    const current = await this.consultationsRepository.findById(request.consultationId)
    if (!current) throw new ConsultationNotFoundError()
    return this.appointmentTransactionProvider!.runWithLockedAppointment(
      current.appointmentId,
      async (appointment) => {
        if (!appointment || appointment.status !== 'scheduled') {
          throw new ConsultationAppointmentCancelledError()
        }
        const consultation = await this.consultationsRepository.findById(
          request.consultationId,
        )
        if (!consultation) throw new ConsultationNotFoundError()
        if (
          request.collaboratorProfile !== CollaboratorProfile.Admin &&
          consultation.assignedLawyerId !== request.collaboratorId
        ) {
          throw new ConsultationCompletionBlockedError(
            'Somente o advogado associado pode concluir a consulta.',
          )
        }
        if (consultation.status !== ConsultationStatus.Pending) {
          throw new ConsultationCompletionBlockedError(
            'Somente uma consulta pendente pode ser concluída.',
          )
        }
        if (!consultation.attendanceFinalizedAt) {
          throw new ConsultationCompletionBlockedError(
            'Finalize a ficha de atendimento primeiro.',
          )
        }
        const completedAt = this.datetimeProvider.now()
        const completed = await this.consultationsRepository.replace(
          request.consultationId,
          {
            status: ConsultationStatus.Completed,
            completedAt,
          },
        )
        if (!completed) throw new ConsultationNotFoundError()
        await this.queueCompletionEvent(completed, request, completedAt)
        return completed
      },
    )
  }

  private async queueCompletionEvent(
    completed: Consultation,
    request: Request,
    completedAt: Date,
  ) {
    if (this.outboxRepository) {
      await this.outboxRepository.add({
        id: this.idProvider?.generate() ?? `${completed.id}:${completedAt.toISOString()}`,
        consultationId: completed.id,
        name: ConsultationCompletedEvent._NAME,
        payload: {
          consultationId: completed.id,
          intakeId: completed.intakeId,
          completedBy: request.collaboratorId,
          occurredAt: completedAt.toISOString(),
        },
        occurredAt: completedAt,
      })
    }
  }
}
