import {
  Body,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import { createZodDto, ZodValidationPipe } from 'nestjs-zod'
import { resetFormalizationSignatureConfigurationSchema } from '@hms/validation/formalization'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import { ResetFormalizationSignatureConfigurationUseCase } from '@hms/core/formalization/use-cases'

import { FormalizationApplicationService } from '@/formalization/formalization-application.service'
import { FormalizationsController } from '@/formalization/decorators'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

type RequestBody = Omit<
  Parameters<ResetFormalizationSignatureConfigurationUseCase['execute']>[0],
  'formalizationId' | 'actorId' | 'actorProfile' | 'confirmed'
>

class ResetFormalizationSignatureConfigurationBody extends createZodDto(
  resetFormalizationSignatureConfigurationSchema,
) {}

@FormalizationsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class ResetFormalizationSignatureConfigurationController {
  constructor(private readonly service: FormalizationApplicationService) {}

  @Post(':formalizationId/signature-configuration/reset')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The signature configuration was reset.',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ErrorResponseDto })
  handle(
    @Param('formalizationId', new ParseUUIDPipe()) formalizationId: string,
    @Body(new ZodValidationPipe(resetFormalizationSignatureConfigurationSchema))
    body: ResetFormalizationSignatureConfigurationBody & RequestBody,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.service.resetSignatureConfiguration({
      formalizationId,
      actorId: collaborator.collaboratorId,
      actorProfile: collaborator.profile,
      confirmed: true,
      ...body,
    })
  }
}
