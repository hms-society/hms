import { Controller, Get, Inject, Param, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { GetCaseDocumentExceptionsUseCase } from '@hms/core/document-engine/use-cases'
import type { DocumentException } from '@hms/core/document-engine/domain/entities'
import type { DocumentExceptionsRepository } from '@hms/core/document-engine/interfaces'
import { AuthGuard, ActiveCollaboratorGuard } from '@/identity/guards'
import { CurrentCollaborator } from '@/identity/decorators'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import type { CaseAccessProvider } from '@hms/core/case-management/interfaces'

import { DOCUMENT_ENGINE_REPOSITORIES } from './request-document-exception.controller'
import { CASE_MANAGEMENT_ACCESS } from '@/case-management/constants/case-management-access'

@ApiTags('Document Exceptions')
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
@Controller()
export class ListCaseDocumentExceptionsController {
  private readonly getCaseDocumentExceptionsUseCase: GetCaseDocumentExceptionsUseCase

  constructor(
    @Inject(DOCUMENT_ENGINE_REPOSITORIES.documentExceptions)
    private readonly documentExceptionsRepository: DocumentExceptionsRepository,
    @Inject(CASE_MANAGEMENT_ACCESS.access)
    caseAccessProvider: CaseAccessProvider,
  ) {
    this.getCaseDocumentExceptionsUseCase = new GetCaseDocumentExceptionsUseCase(
      this.documentExceptionsRepository,
      caseAccessProvider,
    )
  }

  @Get('/cases/:caseId/document-exceptions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all document exceptions for a case' })
  @ApiResponse({ status: 200, description: 'Exceptions returned successfully.' })
  async handle(
    @Param('caseId') caseId: string,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ): Promise<DocumentException[]> {
    return this.getCaseDocumentExceptionsUseCase.execute({
      caseId,
      actorId: collaborator.collaboratorId,
    })
  }
}
