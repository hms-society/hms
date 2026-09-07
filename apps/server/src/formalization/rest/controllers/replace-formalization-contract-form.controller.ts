import { Body, Inject, Param, ParseUUIDPipe, Put, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import { createZodDto, ZodValidationPipe } from 'nestjs-zod'
import { replaceFormalizationContractFormSchema } from '@hms/validation/formalization'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import { ReplaceFormalizationContractFormUseCase } from '@hms/core/formalization/use-cases'
import type {
  FormalizationsRepository,
  FormalizationSourceReader,
} from '@hms/core/formalization/interfaces'

import { FORMALIZATION_REPOSITORIES } from '@/formalization/constants/formalization-repositories'
import { FormalizationsController } from '@/formalization/decorators'
import { FormalizationResponseDto } from '@/formalization/rest/dtos'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { ServerFormalizationSourceReader } from '@/formalization/provision'

class ReplaceBody extends createZodDto(replaceFormalizationContractFormSchema) {}

@FormalizationsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class ReplaceFormalizationContractFormController {
  private readonly useCase: ReplaceFormalizationContractFormUseCase

  constructor(
    @Inject(FORMALIZATION_REPOSITORIES.formalizations)
    formalizationsRepository: FormalizationsRepository,
    @Inject(ServerFormalizationSourceReader)
    sourceReader: FormalizationSourceReader,
  ) {
    this.useCase = new ReplaceFormalizationContractFormUseCase(
      formalizationsRepository,
      sourceReader,
    )
  }

  @Put(':formalizationId/contract-form/definition')
  @ApiResponse({ status: 200, type: FormalizationResponseDto })
  handle(
    @Param('formalizationId', new ParseUUIDPipe()) formalizationId: string,
    @Body(new ZodValidationPipe(replaceFormalizationContractFormSchema))
    body: ReplaceBody,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.useCase
      .execute({
        formalizationId,
        actorId: collaborator.collaboratorId,
        actorProfile: collaborator.profile,
        ...body,
      })
      .then((formalization) => ({ ...formalization }))
  }
}
