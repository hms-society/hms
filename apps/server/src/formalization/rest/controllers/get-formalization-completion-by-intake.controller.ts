import { Get, HttpStatus, Param, ParseUUIDPipe, Res, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import type { Response } from 'express'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import { GetFormalizationCompletionByIntakeUseCase } from '@hms/core/formalization/use-cases'
import type {
  FormalizationsRepository,
  FormalizationSignatureRequestsRepository,
} from '@hms/core/formalization/interfaces'
import { Inject } from '@nestjs/common'
import { FORMALIZATION_REPOSITORIES } from '@/formalization/constants'
import { FormalizationsController } from '@/formalization/decorators'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@FormalizationsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class GetFormalizationCompletionByIntakeController {
  private readonly useCase: GetFormalizationCompletionByIntakeUseCase

  constructor(
    @Inject(FORMALIZATION_REPOSITORIES.formalizations)
    formalizationsRepository: FormalizationsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRequests)
    requestsRepository: FormalizationSignatureRequestsRepository,
  ) {
    this.useCase = new GetFormalizationCompletionByIntakeUseCase(
      formalizationsRepository,
      requestsRepository,
    )
  }

  @Get('by-intake/:intakeId/completion')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The formalization completion was returned successfully.',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, type: ErrorResponseDto })
  handle(
    @Param('intakeId', new ParseUUIDPipe()) intakeId: string,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
    @Res() response: Response,
  ) {
    return this.useCase
      .execute({
        intakeId,
        actorId: collaborator.collaboratorId,
        actorProfile: collaborator.profile,
      })
      .then((result) => response.status(HttpStatus.OK).json(result))
  }
}
