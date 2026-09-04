import { Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import { createZodDto } from 'nestjs-zod'
import { formalizationSignatureSendingStatusSchema } from '@hms/validation/formalization'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'

import { FormalizationSignatureSendingService } from '@/formalization/formalization-signature-sending.service'
import { FormalizationsController } from '@/formalization/decorators'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

class FormalizationSignatureSendingStatusResponseDto extends createZodDto(
  formalizationSignatureSendingStatusSchema,
) {}

@FormalizationsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class GetFormalizationSignatureSendingStatusController {
  constructor(private readonly service: FormalizationSignatureSendingService) {}

  @Get(':formalizationId/signature-sending/status')
  @ApiResponse({
    status: 200,
    description: 'The signature sending status was returned successfully.',
    type: FormalizationSignatureSendingStatusResponseDto,
  })
  @ApiResponse({ status: 401, type: ErrorResponseDto })
  @ApiResponse({ status: 403, type: ErrorResponseDto })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  handle(
    @Param('formalizationId', new ParseUUIDPipe()) formalizationId: string,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.service.getStatus({
      formalizationId,
      actorId: collaborator.collaboratorId,
      actorProfile: collaborator.profile,
    })
  }
}
