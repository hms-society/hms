import { Inject, Injectable } from '@nestjs/common'
import type { Formalization } from '@hms/core/formalization/domain/entities'
import type { StartFormalizationRequest } from '@hms/core/formalization/interfaces'
import type { FormalizationsRepository } from '@hms/core/formalization/interfaces'
import { IntakeVersionConflictError } from '@hms/core/intake/domain/errors'
import { IntakeStatus } from '@hms/core/intake/domain/structures'
import type { IntakesRepository } from '@hms/core/intake/interfaces'

import { FORMALIZATION_REPOSITORIES } from '@/formalization/constants/formalization-repositories'
import { INTAKE_REPOSITORIES } from '@/intake/constants/intake-repositories'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import type { DrizzleDatabaseExecutor } from '@/shared/database/drizzle/drizzle-repository'

type TransactionalFormalizationsRepository = FormalizationsRepository & {
  withDatabase(database: DrizzleDatabaseExecutor): FormalizationsRepository
}

type TransactionalIntakesRepository = IntakesRepository & {
  withDatabase(database: DrizzleDatabaseExecutor): IntakesRepository
}

export interface FormalizationStartTransaction {
  startFormalization(request: StartFormalizationRequest): Promise<Formalization>
}

@Injectable()
export class DrizzleFormalizationStartTransaction
  implements FormalizationStartTransaction
{
  constructor(
    private readonly drizzleClient: DrizzleClient,
    @Inject(FORMALIZATION_REPOSITORIES.formalizations)
    private readonly formalizationsRepository: TransactionalFormalizationsRepository,
    @Inject(INTAKE_REPOSITORIES.intakes)
    private readonly intakesRepository: TransactionalIntakesRepository,
  ) {}

  startFormalization(request: StartFormalizationRequest) {
    return this.drizzleClient.requireDatabase().transaction(async (transaction) => {
      const formalizationsRepository =
        this.formalizationsRepository.withDatabase(transaction)
      const intakesRepository = this.intakesRepository.withDatabase(transaction)
      const formalization = await formalizationsRepository.addOrGet(request.formalization)

      if (formalization.id !== request.formalization.id) return formalization

      const intake = await intakesRepository.replace({
        intakeId: request.formalization.intakeId,
        expectedVersion: request.expectedIntakeVersion,
        changes: {
          status: IntakeStatus.InFormalization,
          updatedBy: request.actorId,
        },
      })
      if (!intake) throw new IntakeVersionConflictError()

      return formalization
    })
  }
}
