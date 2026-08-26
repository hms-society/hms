import { Body, Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'
import { createZodDto, ZodValidationPipe } from 'nestjs-zod'
import { saveFormalizationDocumentVersionSchema } from '@hms/validation/formalization'
import type { DocumentTemplateContent } from '@hms/core/document-production/domain/structures'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'

import { FormalizationApplicationService } from '@/formalization/formalization-application.service'
import { FormalizationsController } from '@/formalization/decorators'
import { FormalizationDocumentVersionResponseDto } from '@/formalization/rest/dtos'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'

class SaveManualBody extends createZodDto(saveFormalizationDocumentVersionSchema) {}

@FormalizationsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class SaveManualFormalizationDocumentVersionController {
  constructor(private readonly service: FormalizationApplicationService) {}

  @Patch(':formalizationId/document-versions/:versionId')
  handle(
    @Param('formalizationId', new ParseUUIDPipe()) formalizationId: string,
    @Param('versionId', new ParseUUIDPipe()) versionId: string,
    @Body(new ZodValidationPipe(saveFormalizationDocumentVersionSchema))
    body: SaveManualBody,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.service
      .getVersion({
        formalizationId,
        versionId,
        actorId: collaborator.collaboratorId,
        actorProfile: collaborator.profile,
      })
      .then((version) =>
        this.service.saveManualVersion({
          formalizationId,
          documentId: version.documentId,
          sourceDocumentVersionId: body.sourceDocumentVersionId,
          actorId: collaborator.collaboratorId,
          content: body.content as DocumentTemplateContent,
          actorProfile: collaborator.profile,
        }),
      )
      .then(FormalizationDocumentVersionResponseDto.fromDomain)
  }
}
