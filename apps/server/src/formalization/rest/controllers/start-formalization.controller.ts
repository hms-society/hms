import {
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import {
  GetFormalizationUseCase,
  StartFormalizationUseCase,
} from '@hms/core/formalization/use-cases'
import type {
  FormalizationIntakeLifecycleService,
  FormalizationsRepository,
  FormalizationSourceReader,
} from '@hms/core/formalization/interfaces'

import { FORMALIZATION_REPOSITORIES } from '@/formalization/constants/formalization-repositories'
import { FormalizationsController } from '@/formalization/decorators'
import { FormalizationResponseDto } from '@/formalization/rest/dtos'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import {
  ServerFormalizationIntakeLifecycleService,
  ServerFormalizationSourceReader,
} from '@/formalization/provision'
import { IdProvider } from '@/shared/provision/id/id-provider'

@FormalizationsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class StartFormalizationController {
  private readonly startUseCase: StartFormalizationUseCase
  private readonly getUseCase: GetFormalizationUseCase

  constructor(
    @Inject(FORMALIZATION_REPOSITORIES.formalizations)
    formalizationsRepository: FormalizationsRepository,
    @Inject(ServerFormalizationSourceReader)
    sourceReader: FormalizationSourceReader,
    @Inject(ServerFormalizationIntakeLifecycleService)
    intakeLifecycleService: FormalizationIntakeLifecycleService,
    idProvider: IdProvider,
  ) {
    this.startUseCase = new StartFormalizationUseCase(
      formalizationsRepository,
      sourceReader,
      intakeLifecycleService,
      idProvider,
    )
    this.getUseCase = new GetFormalizationUseCase(formalizationsRepository, sourceReader)
  }

  @Post('by-intake/:intakeId/start')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: HttpStatus.OK, type: FormalizationResponseDto })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponseDto })
  handle(
    @Param('intakeId', new ParseUUIDPipe()) intakeId: string,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.startUseCase
      .execute({
        intakeId,
        actorId: collaborator.collaboratorId,
        actorProfile: collaborator.profile,
      })
      .then((formalization) =>
        this.getUseCase.execute({
          formalizationId: formalization.id,
          actorId: collaborator.collaboratorId,
          actorProfile: collaborator.profile,
        }),
      )
      .then(FormalizationResponseDto.fromDomain)
  }
}
