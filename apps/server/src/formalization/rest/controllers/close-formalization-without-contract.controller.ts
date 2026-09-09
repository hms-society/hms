import { Body, Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'
import { createZodDto, ZodValidationPipe } from 'nestjs-zod'
import { closeFormalizationWithoutContractSchema } from '@hms/validation/formalization'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import {
  CloseFormalizationWithoutContractUseCase,
  GetFormalizationUseCase,
} from '@hms/core/formalization/use-cases'
import type {
  FormalizationIntakeClosureService,
  FormalizationSourceReader,
  FormalizationsRepository,
} from '@hms/core/formalization/interfaces'

import { FORMALIZATION_REPOSITORIES } from '@/formalization/constants'
import {
  ServerFormalizationIntakeClosureService,
  ServerFormalizationSourceReader,
} from '@/formalization/provision'
import { FormalizationsController } from '@/formalization/decorators'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { Inject } from '@nestjs/common'

class CloseWithoutContractBody extends createZodDto(
  closeFormalizationWithoutContractSchema,
) {}

@FormalizationsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class CloseFormalizationWithoutContractController {
  private readonly getUseCase: GetFormalizationUseCase
  private readonly closeUseCase: CloseFormalizationWithoutContractUseCase

  constructor(
    @Inject(FORMALIZATION_REPOSITORIES.formalizations)
    formalizationsRepository: FormalizationsRepository,
    @Inject(ServerFormalizationSourceReader)
    sourceReader: FormalizationSourceReader,
    @Inject(ServerFormalizationIntakeClosureService)
    intakeClosureService: FormalizationIntakeClosureService,
    datetimeProvider: DatetimeProvider,
  ) {
    this.getUseCase = new GetFormalizationUseCase(formalizationsRepository, sourceReader)
    this.closeUseCase = new CloseFormalizationWithoutContractUseCase(
      formalizationsRepository,
      intakeClosureService,
      datetimeProvider,
    )
  }

  @Patch(':formalizationId/close-without-contract')
  handle(
    @Param('formalizationId', new ParseUUIDPipe()) formalizationId: string,
    @Body(new ZodValidationPipe(closeFormalizationWithoutContractSchema))
    body: CloseWithoutContractBody,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.getUseCase
      .execute({
        formalizationId,
        actorId: collaborator.collaboratorId,
        actorProfile: collaborator.profile,
      })
      .then(({ formalization }) =>
        this.closeUseCase.execute({
          formalizationId,
          intakeId: formalization.intakeId,
          actorId: collaborator.collaboratorId,
          reason: body.reason,
          notes: body.notes,
          expectedVersion: body.expectedIntakeVersion,
          expectedFormalizationVersion: body.expectedVersion,
          actorProfile: collaborator.profile,
        }),
      )
  }
}
