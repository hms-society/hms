import type { DatetimeProvider, UseCase } from '#shared/interfaces'

import type { DocumentPackagesRepository } from '../../document-production/interfaces'
import {
  CollaboratorProfile,
  type CollaboratorProfile as CollaboratorProfileValue,
} from '../../identity/domain/structures'
import {
  ConsultationDocumentAccessDeniedError,
  ConsultationNotFoundError,
  ConsultationPackageConfirmationError,
} from '../domain/errors'
import type { ConsultationsRepository } from '../interfaces'

type Request = {
  readonly consultationId: string
  readonly collaboratorId: string
  readonly collaboratorProfile: CollaboratorProfileValue
}

export class ReopenConsultationDocumentPackageUseCase implements UseCase<Request, void> {
  constructor(
    private readonly consultationsRepository: ConsultationsRepository,
    private readonly documentPackagesRepository: DocumentPackagesRepository,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

  async execute(request: Request): Promise<void> {
    const consultation = await this.consultationsRepository.findById(
      request.consultationId,
    )
    if (!consultation) throw new ConsultationNotFoundError()
    if (
      request.collaboratorProfile !== CollaboratorProfile.Admin &&
      consultation.assignedLawyerId !== request.collaboratorId
    ) {
      throw new ConsultationDocumentAccessDeniedError()
    }
    if (!consultation.attendanceFinalizedAt) {
      throw new ConsultationPackageConfirmationError(
        'Finalize a ficha de atendimento antes de editar o pacote.',
      )
    }

    const documentPackage = await this.documentPackagesRepository.findByContext({
      type: 'consultation',
      consultationId: request.consultationId,
    })
    if (!documentPackage?.confirmedAt) {
      throw new ConsultationPackageConfirmationError(
        'O pacote de documentos ainda não foi confirmado.',
      )
    }

    const reopened = await this.documentPackagesRepository.reopen(
      documentPackage.id,
      this.datetimeProvider.now(),
    )
    if (!reopened) {
      throw new ConsultationPackageConfirmationError(
        'Não foi possível reabrir o pacote de documentos.',
      )
    }
  }
}
