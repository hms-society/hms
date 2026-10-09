import { Inject, Injectable } from '@nestjs/common'
import type { IdentityTransactionScope } from '@hms/core/identity/interfaces'

import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import type { IdentityDatabaseExecutor } from '@/identity/database/drizzle/repositories/drizzle-identity-repository'
import {
  DrizzleCollaboratorRegistrationAttemptsRepository,
  DrizzleCollaboratorsRepository,
  DrizzleUsersRepository,
} from '@/identity/database/drizzle/repositories'

@Injectable()
export class IdentityTransactionScopeProvider {
  constructor(
    @Inject(IDENTITY_REPOSITORIES.users)
    private readonly usersRepository: DrizzleUsersRepository,
    @Inject(IDENTITY_REPOSITORIES.collaborators)
    private readonly collaboratorsRepository: DrizzleCollaboratorsRepository,
    @Inject(IDENTITY_REPOSITORIES.registrationAttempts)
    private readonly registrationAttemptsRepository: DrizzleCollaboratorRegistrationAttemptsRepository,
  ) {}

  create(database: IdentityDatabaseExecutor): IdentityTransactionScope {
    return {
      usersRepository: this.usersRepository.withDatabase(database),
      collaboratorsRepository: this.collaboratorsRepository.withDatabase(database),
      registrationAttemptsRepository:
        this.registrationAttemptsRepository.withDatabase(database),
    }
  }
}
