import type { CollaboratorProfessionalProfile } from '../domain/structures/collaborator-professional-profile'
import type { GetCollaboratorProfessionalProfileRequest } from '../domain/structures/get-collaborator-professional-profile-request'
import { CollaboratorNotAuthorizedError, CollaboratorNotFoundError } from '../domain/errors'
import { CollaboratorProfile, type CollaboratorProfile as CollaboratorProfileType } from '../domain/structures/collaborator-profile'
import type { CollaboratorsRepository } from '../interfaces/collaborators-repository'
import type { UsersRepository } from '../interfaces/users-repository'
import type { UseCase } from '#shared/interfaces/use-case'

const AUTHORIZED_PROFILES = new Set<CollaboratorProfileType>([
  CollaboratorProfile.Admin,
  CollaboratorProfile.Lawyer,
  CollaboratorProfile.Paralegal,
  CollaboratorProfile.Supervisor,
])

export class GetCollaboratorProfessionalProfileUseCase
  implements UseCase<GetCollaboratorProfessionalProfileRequest, CollaboratorProfessionalProfile>
{
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly collaboratorsRepository: CollaboratorsRepository,
  ) {}

  async execute({
    collaboratorId,
    actorId,
  }: GetCollaboratorProfessionalProfileRequest): Promise<CollaboratorProfessionalProfile> {
    const actor = await this.usersRepository.findById(actorId)
    const actorCollaborator = actor?.status === 'active'
      ? await this.collaboratorsRepository.findByUserId(actorId)
      : undefined

    if (!actorCollaborator || !AUTHORIZED_PROFILES.has(actorCollaborator.profile)) {
      throw new CollaboratorNotAuthorizedError()
    }

    const target = await this.collaboratorsRepository.findSummaryById(collaboratorId)
    if (!target) throw new CollaboratorNotFoundError()

    return {
      collaboratorId: target.collaboratorId,
      professionalName: target.professionalName,
      email: target.email,
      profile: target.profile,
      legalExpertises: target.legalExpertises ?? [],
    }
  }
}
