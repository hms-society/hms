import { Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import { createZodDto } from 'nestjs-zod'
import { formalizationSignatureSendingReviewSchema } from '@hms/validation/formalization'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'

import { FormalizationSignatureSendingService } from '@/formalization/formalization-signature-sending.service'
import { FormalizationsController } from '@/formalization/decorators'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

class FormalizationSignatureSendingReviewResponseDto extends createZodDto(
  formalizationSignatureSendingReviewSchema,
) {}

@FormalizationsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class GetFormalizationSignatureSendingReviewController {
  constructor(private readonly service: FormalizationSignatureSendingService) {}

  @Get(':formalizationId/signature-sending/review')
  @ApiResponse({
    status: 200,
    description: 'The signature sending review was returned successfully.',
    type: FormalizationSignatureSendingReviewResponseDto,
  })
  @ApiResponse({ status: 401, type: ErrorResponseDto })
  @ApiResponse({ status: 403, type: ErrorResponseDto })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  handle(
    @Param('formalizationId', new ParseUUIDPipe()) formalizationId: string,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.service.getReview({
      formalizationId,
      actorId: collaborator.collaboratorId,
      actorProfile: collaborator.profile,
    })
  }
}
