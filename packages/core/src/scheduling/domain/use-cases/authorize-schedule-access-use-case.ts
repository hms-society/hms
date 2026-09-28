import { CollaboratorProfile, type CollaboratorProfile as CollaboratorProfileValue } from '#identity/domain/structures'
import type { UseCase } from '#shared/interfaces'

import { AppointmentActionForbiddenError } from '../errors'
import type { SchedulesRepository } from '../../interfaces'

type Request = {
  actor: {
    collaboratorId: string
    profile: CollaboratorProfileValue
    status?: string
  }
  scheduleId?: string
  collaboratorId?: string
  operation: 'read' | 'write'
}

export class AuthorizeScheduleAccessUseCase implements UseCase<Request> {
  constructor(private readonly schedulesRepository: SchedulesRepository) {}

  async execute(request: Request): Promise<void> {
    const { actor } = request
    if (actor.status && actor.status !== 'active') {
      throw new AppointmentActionForbiddenError()
    }

    const targetCollaboratorId = request.collaboratorId ??
      (request.scheduleId
        ? (await this.schedulesRepository.findById(request.scheduleId))?.collaboratorId
        : undefined)

    if (!targetCollaboratorId) throw new AppointmentActionForbiddenError()

    if (actor.profile === CollaboratorProfile.Lawyer) {
      if (targetCollaboratorId !== actor.collaboratorId) {
        throw new AppointmentActionForbiddenError()
      }
      return
    }

    if (
      request.operation === 'write' &&
      actor.profile !== CollaboratorProfile.Admin &&
      actor.profile !== CollaboratorProfile.Attendant
    ) {
      throw new AppointmentActionForbiddenError()
    }

    if (
      actor.profile !== CollaboratorProfile.Admin &&
      actor.profile !== CollaboratorProfile.Attendant &&
      actor.profile !== CollaboratorProfile.Paralegal &&
      actor.profile !== CollaboratorProfile.Supervisor
    ) {
      throw new AppointmentActionForbiddenError()
    }
  }
}
