import {
  Body,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import type { DocumentVersionsRepository } from '@hms/core/document-production/interfaces'
import { SaveEditableDocumentVersionUseCase } from '@hms/core/document-production/use-cases'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import type { DocumentTemplateContent } from '@hms/core/document-production/domain/structures'
import { documentTemplateContentSchema } from '@hms/validation/document-production'
import { ZodValidationPipe } from 'nestjs-zod'

import { DOCUMENT_PRODUCTION_REPOSITORIES } from '@/document-production/constants/document-production-repositories'
import { CasesController } from '@/case-management/decorators'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'

@CasesController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class SaveEditableCaseDocumentVersionController {
  private readonly useCase: SaveEditableDocumentVersionUseCase

  constructor(
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.versions)
    versions: DocumentVersionsRepository,
  ) {
    this.useCase = new SaveEditableDocumentVersionUseCase(versions)
  }

  @Patch(':caseId/documents/:documentId/versions/:versionId')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conteúdo editável salvo na versão atual',
  })
  handle(
    @Param('versionId', new ParseUUIDPipe()) versionId: string,
    @Body(new ZodValidationPipe(documentTemplateContentSchema))
    content: DocumentTemplateContent,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.useCase.execute({
      documentVersionId: versionId,
      collaboratorId: collaborator.collaboratorId,
      content,
    })
  }
}
