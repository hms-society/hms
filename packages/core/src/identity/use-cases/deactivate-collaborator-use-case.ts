import type { CollaboratorSummary } from '../domain/entities'
import { CollaboratorNotFoundError, UserNotFoundError } from '../domain/errors'
import type { AuthUser } from '../domain/structures'
import type { AuthAdministrationProvider } from '../interfaces/auth-administration-provider'
import type { CollaboratorsRepository } from '../interfaces/collaborators-repository'
import type { UseCase } from '#shared/interfaces/use-case'
import type { CaseIdentityTransaction, IdProvider } from '#shared/interfaces'
import type { EnsureCaseManagerContinuityUseCase } from '@hms/core/case-management/use-cases'

type Request = {
  readonly authUser: AuthUser
  readonly collaboratorId: string
}

export class DeactivateCollaboratorUseCase
  implements UseCase<Request, CollaboratorSummary>
{
  constructor(
    private readonly collaboratorsRepository: CollaboratorsRepository,
    private readonly authAdministrationProvider: AuthAdministrationProvider,
    private readonly authorizeAdministrator: (authUser: AuthUser) => Promise<void>,
    private readonly caseIdentityTransaction: CaseIdentityTransaction,
    private readonly ensureCaseManagerContinuity: EnsureCaseManagerContinuityUseCase,
    private readonly idProvider: IdProvider,
  ) {}

  async execute({ authUser, collaboratorId }: Request): Promise<CollaboratorSummary> {
    await this.authorizeAdministrator(authUser)

    const userId = await this.caseIdentityTransaction.run(async (scope) => {
      const collaborator = await scope.identity.collaboratorsRepository.findById(
        collaboratorId,
      )
      if (!collaborator) throw new CollaboratorNotFoundError()

      const user = await scope.identity.usersRepository.findById(collaborator.userId)
      if (!user) throw new UserNotFoundError()

      if (user.status !== 'disabled') {
        await this.ensureCaseManagerContinuity.executeWithin(scope, {
          collaboratorId,
          nextProfile: collaborator.profile,
          nextStatus: 'disabled',
          actorId: authUser.id,
          operationId: this.idProvider.generate(),
        })
        const updatedUser = await scope.identity.usersRepository.updateStatus(
          user.id,
          'disabled',
        )
        if (!updatedUser) throw new UserNotFoundError()
      }

      return user.id
    })

    // Auth is remote; the local account is disabled before attempting the ban.
    await this.authAdministrationProvider.setUserBanned(userId, true)

    const summary = await this.collaboratorsRepository.findSummaryByUserId(userId)
    if (!summary) throw new CollaboratorNotFoundError()

    return summary
  }
}
