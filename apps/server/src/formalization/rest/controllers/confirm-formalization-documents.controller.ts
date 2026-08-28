import {
  Body,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import { createZodDto, ZodValidationPipe } from 'nestjs-zod'
import { confirmFormalizationDocumentsSchema } from '@hms/validation/formalization'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'

import { FormalizationApplicationService } from '@/formalization/formalization-application.service'
import { FormalizationsController } from '@/formalization/decorators'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

class ConfirmBody extends createZodDto(confirmFormalizationDocumentsSchema) {}

@FormalizationsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class ConfirmFormalizationDocumentsController {
  constructor(private readonly service: FormalizationApplicationService) {}

  @Patch(':formalizationId/documents/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The document package was confirmed.',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ErrorResponseDto })
  handle(
    @Param('formalizationId', new ParseUUIDPipe()) formalizationId: string,
    @Body(new ZodValidationPipe(confirmFormalizationDocumentsSchema)) body: ConfirmBody,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.service
      .confirmDocuments({
        formalizationId,
        actorId: collaborator.collaboratorId,
        ...body,
        actorProfile: collaborator.profile,
      })
      .then((formalization) => ({ ...formalization }))
  }
}
