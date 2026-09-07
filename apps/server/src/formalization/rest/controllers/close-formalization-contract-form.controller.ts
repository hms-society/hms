import { Body, Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'
import { createZodDto, ZodValidationPipe } from 'nestjs-zod'
import { updateFormalizationContractFormSchema } from '@hms/validation/formalization'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import { CloseFormalizationContractFormUseCase } from '@hms/core/formalization/use-cases'
import type { FormalizationsRepository } from '@hms/core/formalization/interfaces'

import { FORMALIZATION_REPOSITORIES } from '@/formalization/constants'
import { FormalizationsController } from '@/formalization/decorators'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { Inject } from '@nestjs/common'

class CloseBody extends createZodDto(updateFormalizationContractFormSchema) {}

@FormalizationsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class CloseFormalizationContractFormController {
  private readonly useCase: CloseFormalizationContractFormUseCase

  constructor(
    @Inject(FORMALIZATION_REPOSITORIES.formalizations)
    formalizationsRepository: FormalizationsRepository,
    datetimeProvider: DatetimeProvider,
  ) {
    this.useCase = new CloseFormalizationContractFormUseCase(
      formalizationsRepository,
      datetimeProvider,
    )
  }

  @Patch(':formalizationId/contract-form/close')
  handle(
    @Param('formalizationId', new ParseUUIDPipe()) formalizationId: string,
    @Body(new ZodValidationPipe(updateFormalizationContractFormSchema)) body: CloseBody,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.useCase.execute({
      formalizationId,
      actorId: collaborator.collaboratorId,
      ...body,
      actorProfile: collaborator.profile,
    })
  }
}
