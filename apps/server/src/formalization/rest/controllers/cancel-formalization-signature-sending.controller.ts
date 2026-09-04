import { Body, HttpCode, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import { createZodDto, ZodValidationPipe } from 'nestjs-zod'
import { cancelFormalizationSignatureSendingSchema } from '@hms/validation/formalization'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'

import { FormalizationSignatureSendingService } from '@/formalization/formalization-signature-sending.service'
import { FormalizationsController } from '@/formalization/decorators'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

class CancelFormalizationSignatureSendingBody extends createZodDto(
  cancelFormalizationSignatureSendingSchema,
) {}

@FormalizationsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class CancelFormalizationSignatureSendingController {
  constructor(private readonly service: FormalizationSignatureSendingService) {}

  @Post(':formalizationId/signature-sending/cancel')
  @HttpCode(200)
  @ApiResponse({
    status: 200,
    description: 'The signature sending cancellation was scheduled.',
  })
  @ApiResponse({ status: 400, type: ErrorResponseDto })
  @ApiResponse({ status: 409, type: ErrorResponseDto })
  handle(
    @Param('formalizationId', new ParseUUIDPipe()) formalizationId: string,
    @Body(new ZodValidationPipe(cancelFormalizationSignatureSendingSchema))
    body: CancelFormalizationSignatureSendingBody,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.service.cancel({
      formalizationId,
      actorId: collaborator.collaboratorId,
      actorProfile: collaborator.profile,
      ...body,
    })
  }
}
