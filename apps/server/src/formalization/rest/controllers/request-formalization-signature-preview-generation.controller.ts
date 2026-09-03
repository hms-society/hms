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
import { requestFormalizationSignaturePreviewGenerationSchema } from '@hms/validation/formalization'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import { RequestFormalizationSignaturePreviewGenerationUseCase } from '@hms/core/formalization/use-cases'

import { FormalizationApplicationService } from '@/formalization/formalization-application.service'
import { FormalizationsController } from '@/formalization/decorators'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

type RequestBody = Omit<
  Parameters<RequestFormalizationSignaturePreviewGenerationUseCase['execute']>[0],
  'formalizationId' | 'actorId' | 'actorProfile' | 'previewId'
>

class RequestFormalizationSignaturePreviewGenerationBody extends createZodDto(
  requestFormalizationSignaturePreviewGenerationSchema,
) {}

@FormalizationsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class RequestFormalizationSignaturePreviewGenerationController {
  constructor(private readonly service: FormalizationApplicationService) {}

  @Post(':formalizationId/signature-configuration/previews/:previewId/retry')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The preview generation was requested again.',
  })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ErrorResponseDto })
  handle(
    @Param('formalizationId', new ParseUUIDPipe()) formalizationId: string,
    @Param('previewId', new ParseUUIDPipe()) previewId: string,
    @Body(new ZodValidationPipe(requestFormalizationSignaturePreviewGenerationSchema))
    body: RequestFormalizationSignaturePreviewGenerationBody & RequestBody,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.service.retrySignaturePreview({
      formalizationId,
      previewId,
      actorId: collaborator.collaboratorId,
      actorProfile: collaborator.profile,
      ...body,
    })
  }
}
