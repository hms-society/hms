import { Body, Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'
import { createZodDto, ZodValidationPipe } from 'nestjs-zod'
import { confirmFormalizationDocumentsSchema } from '@hms/validation/formalization'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'

import { FormalizationApplicationService } from '@/formalization/formalization-application.service'
import { FormalizationsController } from '@/formalization/decorators'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'

class ConfirmBody extends createZodDto(confirmFormalizationDocumentsSchema) {}

@FormalizationsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class ConfirmFormalizationDocumentsController {
  constructor(private readonly service: FormalizationApplicationService) {}

  @Patch(':formalizationId/documents/confirm')
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
