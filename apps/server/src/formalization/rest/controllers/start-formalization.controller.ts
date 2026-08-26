import {
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'

import { FormalizationApplicationService } from '@/formalization/formalization-application.service'
import { FormalizationsController } from '@/formalization/decorators'
import { FormalizationResponseDto } from '@/formalization/rest/dtos'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@FormalizationsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class StartFormalizationController {
  constructor(private readonly service: FormalizationApplicationService) {}

  @Post('by-intake/:intakeId/start')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: HttpStatus.OK, type: FormalizationResponseDto })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponseDto })
  handle(
    @Param('intakeId', new ParseUUIDPipe()) intakeId: string,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.service
      .start({
        intakeId,
        actorId: collaborator.collaboratorId,
        actorProfile: collaborator.profile,
      })
      .then((formalization) =>
        this.service.get({
          formalizationId: formalization.id,
          actorId: collaborator.collaboratorId,
          actorProfile: collaborator.profile,
        }),
      )
      .then(FormalizationResponseDto.fromDomain)
  }
}
