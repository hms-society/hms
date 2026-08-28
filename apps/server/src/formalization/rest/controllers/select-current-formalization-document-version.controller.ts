import { Body, Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'
import { z } from 'zod'
import { createZodDto, ZodValidationPipe } from 'nestjs-zod'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'

import { FormalizationApplicationService } from '@/formalization/formalization-application.service'
import { FormalizationsController } from '@/formalization/decorators'
import { FormalizationDocumentVersionResponseDto } from '@/formalization/rest/dtos'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'

const selectCurrentVersionSchema = z.object({ versionId: z.uuid() }).strict()
class SelectCurrentBody extends createZodDto(selectCurrentVersionSchema) {}

@FormalizationsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class SelectCurrentFormalizationDocumentVersionController {
  constructor(private readonly service: FormalizationApplicationService) {}

  @Patch(':formalizationId/documents/:documentId/current-version')
  handle(
    @Param('formalizationId', new ParseUUIDPipe()) formalizationId: string,
    @Param('documentId', new ParseUUIDPipe()) documentId: string,
    @Body(new ZodValidationPipe(selectCurrentVersionSchema)) body: SelectCurrentBody,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.service
      .selectCurrentVersion({
        formalizationId,
        documentId,
        versionId: body.versionId,
        actorId: collaborator.collaboratorId,
        actorProfile: collaborator.profile,
      })
      .then(FormalizationDocumentVersionResponseDto.fromDomain)
  }
}
