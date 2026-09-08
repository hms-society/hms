import { Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import { GetFormalizationUseCase } from '@hms/core/formalization/use-cases'
import type {
  FormalizationSourceReader,
  FormalizationsRepository,
} from '@hms/core/formalization/interfaces'

import { FORMALIZATION_REPOSITORIES } from '@/formalization/constants'
import { ServerFormalizationSourceReader } from '@/formalization/provision'
import { FormalizationsController } from '@/formalization/decorators'
import { FormalizationResponseDto } from '@/formalization/rest/dtos'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { Inject } from '@nestjs/common'

@FormalizationsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class GetFormalizationController {
  private readonly useCase: GetFormalizationUseCase

  constructor(
    @Inject(FORMALIZATION_REPOSITORIES.formalizations)
    formalizationsRepository: FormalizationsRepository,
    @Inject(ServerFormalizationSourceReader) sourceReader: FormalizationSourceReader,
  ) {
    this.useCase = new GetFormalizationUseCase(formalizationsRepository, sourceReader)
  }

  @Get(':formalizationId')
  @ApiResponse({ status: 200, type: FormalizationResponseDto })
  @ApiResponse({ status: 403, type: ErrorResponseDto })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  handle(
    @Param('formalizationId', new ParseUUIDPipe()) formalizationId: string,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.useCase
      .execute({
        formalizationId,
        actorId: collaborator.collaboratorId,
        actorProfile: collaborator.profile,
      })
      .then(FormalizationResponseDto.fromDomain)
  }
}
