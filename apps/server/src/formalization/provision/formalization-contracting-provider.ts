import { Inject, Injectable } from '@nestjs/common'
import type { FormalizationContractingTransaction } from '@hms/core/formalization/interfaces'
import type { IntakeContractingService } from '@hms/core/intake/interfaces'
import { FORMALIZATION_REPOSITORIES } from '@/formalization/constants/formalization-repositories'
import { INTAKE_PROVIDERS } from '@/intake/constants/intake-providers'
import type { FormalizationsRepository } from '@hms/core/formalization/interfaces'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import {
  FormalizationContractingConflictError,
  FormalizationStatus,
} from '@hms/core/formalization/domain'
import { IntakeStatus } from '@hms/core/intake/domain/structures'

@Injectable()
export class FormalizationContractingProvider
  implements FormalizationContractingTransaction
{
  constructor(
    private readonly drizzleClient: DrizzleClient,
    @Inject(FORMALIZATION_REPOSITORIES.formalizations)
    private readonly formalizationsRepository: FormalizationsRepository,
    @Inject(INTAKE_PROVIDERS.contractingService)
    private readonly intakeContractingService: IntakeContractingService,
  ) {}

  async confirm(input: Parameters<FormalizationContractingTransaction['confirm']>[0]) {
    return this.drizzleClient.runInTransaction(async () => {
      const formalization = await this.formalizationsRepository.findById(
        input.formalizationId,
      )
      if (!formalization || formalization.intakeId !== input.intakeId)
        return { outcome: 'conflict' as const }

      if (formalization.status === FormalizationStatus.Completed) {
        if (formalization.contractingConfirmationKey !== input.confirmationKey)
          return { outcome: 'conflict' as const }
        const intake = await this.intakeContractingService.contract({
          intakeId: input.intakeId,
          expectedVersion: input.expectedIntakeVersion,
          contractedAt: input.contractedAt,
          updatedBy: input.actorId,
        })
        if (intake.status !== IntakeStatus.Contracted || !intake.contractedAt) {
          return { outcome: 'conflict' as const }
        }
        return {
          outcome: 'duplicate' as const,
          result: {
            formalizationId: formalization.id,
            formalizationStatus: 'completed' as const,
            formalizationVersion: formalization.version,
            intakeId: intake.id,
            intakeStatus: 'contracted' as const,
            intakeVersion: intake.version,
            contractedAt: intake.contractedAt,
            duplicate: true,
          },
        }
      }

      const intake = await this.intakeContractingService.contract({
        intakeId: input.intakeId,
        expectedVersion: input.expectedIntakeVersion,
        contractedAt: input.contractedAt,
        updatedBy: input.actorId,
      })
      const completed = await this.formalizationsRepository.replace({
        formalizationId: input.formalizationId,
        expectedVersion: input.expectedFormalizationVersion,
        changes: {
          status: FormalizationStatus.Completed,
          completedAt: input.contractedAt,
          completedByCollaboratorId: input.actorId,
          contractingConfirmationKey: input.confirmationKey,
        } as never,
      })
      if (!completed || completed.signatureRequestId !== input.requestId) {
        throw new FormalizationContractingConflictError()
      }
      return {
        outcome: 'applied' as const,
        result: {
          formalizationId: completed.id,
          formalizationStatus: 'completed' as const,
          formalizationVersion: completed.version,
          intakeId: intake.id,
          intakeStatus: 'contracted' as const,
          intakeVersion: intake.version,
          contractedAt: input.contractedAt,
          duplicate: false,
        },
      }
    })
  }
}
