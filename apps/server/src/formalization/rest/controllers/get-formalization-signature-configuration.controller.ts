import { Get, HttpStatus, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import { createZodDto } from 'nestjs-zod'
import { formalizationSignatureConfigurationSchema } from '@hms/validation/formalization'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'

import { FormalizationApplicationService } from '@/formalization/formalization-application.service'
import { FormalizationsController } from '@/formalization/decorators'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

class FormalizationSignatureConfigurationResponseDto extends createZodDto(
  formalizationSignatureConfigurationSchema,
) {}

@FormalizationsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class GetFormalizationSignatureConfigurationController {
  constructor(private readonly service: FormalizationApplicationService) {}

  @Get(':formalizationId/signature-configuration')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The signature configuration was returned successfully.',
    type: FormalizationSignatureConfigurationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication is required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'The collaborator cannot access this Formalization.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The Formalization was not found.',
    type: ErrorResponseDto,
  })
  handle(
    @Param('formalizationId', new ParseUUIDPipe()) formalizationId: string,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.service.getSignatureConfiguration({
      formalizationId,
      actorId: collaborator.collaboratorId,
      actorProfile: collaborator.profile,
    })
  }
}
