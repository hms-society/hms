import { Inject, Injectable } from '@nestjs/common'
import type { Formalization } from '@hms/core/formalization/domain/entities'
import type { CloseFormalizationRequest } from '@hms/core/formalization/interfaces'
import type { FormalizationsRepository } from '@hms/core/formalization/interfaces'
import {
  FormalizationNotFoundError,
  FormalizationStateConflictError,
} from '@hms/core/formalization/domain/errors'
import { FormalizationStatus } from '@hms/core/formalization/domain/structures'
import { CloseIntakeWithoutContractUseCase } from '@hms/core/intake/use-cases'
import type { IntakesRepository } from '@hms/core/intake/interfaces'
import { FormalizationVersionConflictError } from '@hms/core/formalization/domain/errors'

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

export interface FormalizationCloseTransaction {
  closeWithoutContract(request: CloseFormalizationRequest): Promise<Formalization>
}

@Injectable()
export class DrizzleFormalizationCloseTransaction
  implements FormalizationCloseTransaction
{
  constructor(
    private readonly drizzleClient: DrizzleClient,
    @Inject(FORMALIZATION_REPOSITORIES.formalizations)
    private readonly formalizationsRepository: TransactionalFormalizationsRepository,
    @Inject(INTAKE_REPOSITORIES.intakes)
    private readonly intakesRepository: TransactionalIntakesRepository,
  ) {}

  closeWithoutContract(request: CloseFormalizationRequest) {
    return this.drizzleClient.requireDatabase().transaction(async (transaction) => {
      const formalizationsRepository =
        this.formalizationsRepository.withDatabase(transaction)
      const intakesRepository = this.intakesRepository.withDatabase(transaction)
      const formalization = await formalizationsRepository.findById(
        request.formalizationId,
      )

      if (!formalization) throw new FormalizationNotFoundError()
      if (formalization.intakeId !== request.intakeId) {
        throw new FormalizationStateConflictError(
          'O Intake informado não pertence à formalização autorizada.',
        )
      }
      if (formalization.status === FormalizationStatus.Cancelled) return formalization

      const closeIntakeUseCase = new CloseIntakeWithoutContractUseCase(
        intakesRepository,
        { now: () => request.cancelledAt },
      )
      await closeIntakeUseCase.execute({
        intakeId: request.intakeId,
        expectedVersion: request.expectedIntakeVersion,
        closureReason: request.reason,
        closureNotes: request.notes,
        updatedBy: request.actorId,
      })

      const cancelled = await formalizationsRepository.replace({
        formalizationId: formalization.id,
        expectedVersion: request.expectedFormalizationVersion,
        changes: {
          status: FormalizationStatus.Cancelled,
          cancelledAt: request.cancelledAt,
          cancelledByCollaboratorId: request.actorId,
        },
      })
      if (!cancelled) throw new FormalizationVersionConflictError()

      return cancelled
    })
  }
}
