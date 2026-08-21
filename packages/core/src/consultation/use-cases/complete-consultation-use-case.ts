import type { DocumentPackagesRepository } from '../../document-production/interfaces'
import type { Broker, DatetimeProvider, UseCase } from '#shared/interfaces'
import {
  CollaboratorProfile,
  type CollaboratorProfile as CollaboratorProfileValue,
} from '../../identity/domain/structures'

import {
  ConsultationCompletionBlockedError,
  ConsultationNotFoundError,
} from '../domain/errors'
import { ConsultationCompletedEvent } from '../domain/events'
import { ConsultationStatus } from '../domain/structures'
import type { Consultation } from '../domain/entities'
import type { ConsultationsRepository } from '../interfaces'

type Request = {
  readonly consultationId: string
  readonly collaboratorId: string
  readonly collaboratorProfile: CollaboratorProfileValue
}

export class CompleteConsultationUseCase implements UseCase<Request, Consultation> {
  constructor(
    private readonly consultationsRepository: ConsultationsRepository,
    private readonly documentPackagesRepository: DocumentPackagesRepository,
    private readonly broker: Broker,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

  async execute(request: Request) {
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

    const documentPackage = await this.documentPackagesRepository.findByContext({
      type: 'consultation',
      consultationId: request.consultationId,
    })
    if (!documentPackage?.confirmedAt) {
      throw new ConsultationCompletionBlockedError(
        'Confirme o pacote de documentos antes de concluir a consulta.',
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
}
