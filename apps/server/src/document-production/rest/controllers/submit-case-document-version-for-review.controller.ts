import {
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import type { DocumentVersionsRepository } from '@hms/core/document-production/interfaces'
import { SubmitDocumentVersionForReviewUseCase } from '@hms/core/document-production/use-cases'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'

import { CasesController } from '@/case-management/decorators'
import { DOCUMENT_PRODUCTION_REPOSITORIES } from '@/document-production/constants/document-production-repositories'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'

@CasesController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class SubmitCaseDocumentVersionForReviewController {
  private readonly useCase: SubmitDocumentVersionForReviewUseCase

  constructor(
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.versions)
    versions: DocumentVersionsRepository,
  ) {
    this.useCase = new SubmitDocumentVersionForReviewUseCase(versions)
  }

  @Patch(':caseId/documents/:documentId/versions/:versionId/submit-review')
  @ApiResponse({ status: HttpStatus.OK, description: 'Documento enviado para revisão' })
  handle(
    @Param('versionId', new ParseUUIDPipe()) versionId: string,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.useCase.execute({
      documentVersionId: versionId,
      collaboratorId: collaborator.collaboratorId,
    })
  }
}
