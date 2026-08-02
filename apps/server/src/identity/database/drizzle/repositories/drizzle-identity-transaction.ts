import { Injectable } from '@nestjs/common'
import type {
  IdentityTransaction,
  IdentityTransactionScope,
} from '@hms/core/identity/interfaces'

import { DrizzleCollaboratorRegistrationAttemptsRepository } from '@/identity/database/drizzle/repositories/drizzle-collaborator-registration-attempts-repository'
import { DrizzleCollaboratorsRepository } from '@/identity/database/drizzle/repositories/drizzle-collaborators-repository'
import { DrizzleUsersRepository } from '@/identity/database/drizzle/repositories/drizzle-users-repository'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'

@Injectable()
export class DrizzleIdentityTransaction implements IdentityTransaction {
  constructor(
    private readonly drizzleClient: DrizzleClient,
    private readonly usersRepository: DrizzleUsersRepository,
    private readonly collaboratorsRepository: DrizzleCollaboratorsRepository,
    private readonly registrationAttemptsRepository: DrizzleCollaboratorRegistrationAttemptsRepository,
  ) {}

  run<Result>(
    operation: (scope: IdentityTransactionScope) => Promise<Result>,
  ): Promise<Result> {
    return this.drizzleClient.requireDatabase().transaction((transaction) =>
      operation({
        usersRepository: this.usersRepository.withDatabase(transaction),
        collaboratorsRepository: this.collaboratorsRepository.withDatabase(transaction),
        registrationAttemptsRepository:
          this.registrationAttemptsRepository.withDatabase(transaction),
      }),
    )
  }
}
