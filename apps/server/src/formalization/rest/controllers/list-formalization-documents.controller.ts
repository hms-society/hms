import { Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'

import { FormalizationApplicationService } from '@/formalization/formalization-application.service'
import { FormalizationsController } from '@/formalization/decorators'
import { FormalizationDocumentListResponseDto } from '@/formalization/rest/dtos'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'

@FormalizationsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class ListFormalizationDocumentsController {
  constructor(private readonly service: FormalizationApplicationService) {}

  @Get(':formalizationId/documents')
  handle(
    @Param('formalizationId', new ParseUUIDPipe()) formalizationId: string,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.service
      .listDocuments({
        formalizationId,
        actorId: collaborator.collaboratorId,
        actorProfile: collaborator.profile,
      })
      .then(FormalizationDocumentListResponseDto.fromDomain)
  }
}
