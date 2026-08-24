import type { UseCase } from '#shared/interfaces'
import {
  CollaboratorProfile,
  type CollaboratorProfile as CollaboratorProfileValue,
} from '../../identity/domain/structures'

import type { Consultation } from '../domain/entities'
import {
  ConsultationAttendanceFinalizationError,
  ConsultationNotFoundError,
} from '../domain/errors'
import { ConsultationStatus } from '../domain/structures'
import type { ConsultationsRepository } from '../interfaces'

type Request = {
  readonly consultationId: string
  readonly collaboratorId: string
  readonly collaboratorProfile: CollaboratorProfileValue
}

export class EditConsultationAttendanceUseCase implements UseCase<Request, Consultation> {
  constructor(private readonly consultationsRepository: ConsultationsRepository) {}

  async execute(request: Request) {
    const consultation = await this.consultationsRepository.findById(
      request.consultationId,
    )
    if (!consultation) throw new ConsultationNotFoundError()

    if (
      request.collaboratorProfile !== CollaboratorProfile.Admin &&
      consultation.assignedLawyerId !== request.collaboratorId
    ) {
      throw new ConsultationAttendanceFinalizationError(
        'Somente o advogado associado ou um administrador pode editar a ficha de atendimento.',
      )
    }
    if (consultation.status !== ConsultationStatus.Pending) {
      throw new ConsultationAttendanceFinalizationError(
        'A ficha só pode ser editada enquanto a consulta estiver pendente.',
      )
    }
    if (!consultation.attendanceFinalizedAt) return consultation

    const editable = await this.consultationsRepository.replace(request.consultationId, {
      attendanceFinalizedAt: null,
      attendanceFinalizedByCollaboratorId: null,
    })

    if (!editable) throw new ConsultationNotFoundError()
    return editable
  }
}
