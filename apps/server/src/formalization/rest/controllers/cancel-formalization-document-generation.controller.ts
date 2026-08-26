import { Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'

import { FormalizationApplicationService } from '@/formalization/formalization-application.service'
import { FormalizationsController } from '@/formalization/decorators'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'

@FormalizationsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class CancelFormalizationDocumentGenerationController {
  constructor(private readonly service: FormalizationApplicationService) {}

  @Patch(':formalizationId/document-generations/:generationId/cancel')
  handle(
    @Param('formalizationId', new ParseUUIDPipe()) formalizationId: string,
    @Param('generationId', new ParseUUIDPipe()) generationId: string,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.service.cancelGeneration({
      formalizationId,
      generationId,
      actorId: collaborator.collaboratorId,
      actorProfile: collaborator.profile,
    })
  }
}
