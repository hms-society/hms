import type { CollaboratorRegistrationAttemptsRepository } from './collaborator-registration-attempts-repository'
import type { CollaboratorsRepository } from './collaborators-repository'
import type { UsersRepository } from './users-repository'

export interface IdentityTransactionScope {
  readonly collaboratorsRepository: CollaboratorsRepository
  readonly registrationAttemptsRepository: CollaboratorRegistrationAttemptsRepository
  readonly usersRepository: UsersRepository
}
