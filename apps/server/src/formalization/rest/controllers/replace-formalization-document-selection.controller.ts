import { Body, Param, ParseUUIDPipe, Put, UseGuards } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'
import { createZodDto, ZodValidationPipe } from 'nestjs-zod'
import { replaceFormalizationDocumentSelectionSchema } from '@hms/validation/formalization'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'

import { FormalizationApplicationService } from '@/formalization/formalization-application.service'
import { FormalizationsController } from '@/formalization/decorators'
import { FormalizationDocumentSelectionResponseDto } from '@/formalization/rest/dtos'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'

class ReplaceSelectionBody extends createZodDto(
  replaceFormalizationDocumentSelectionSchema,
) {}

@FormalizationsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class ReplaceFormalizationDocumentSelectionController {
  constructor(private readonly service: FormalizationApplicationService) {}

  @Put(':formalizationId/documents/selection')
  handle(
    @Param('formalizationId', new ParseUUIDPipe()) formalizationId: string,
    @Body(new ZodValidationPipe(replaceFormalizationDocumentSelectionSchema))
    body: ReplaceSelectionBody,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.service
      .replaceSelection({
        formalizationId,
        actorId: collaborator.collaboratorId,
        ...body,
        actorProfile: collaborator.profile,
      })
      .then(FormalizationDocumentSelectionResponseDto.fromDomain)
  }
}
