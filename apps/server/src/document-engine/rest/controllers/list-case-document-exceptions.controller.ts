import { Controller, Get, Inject, Param, UseGuards, ForbiddenException } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { GetCaseDocumentExceptionsUseCase } from '@hms/core/document-engine/use-cases'
import type { DocumentException } from '@hms/core/document-engine/domain/entities'
import type { DocumentExceptionsRepository } from '@hms/core/document-engine/interfaces'
import { AuthGuard, ActiveCollaboratorGuard } from '@/identity/guards'
import { CurrentCollaborator } from '@/identity/decorators'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'

import { DOCUMENT_ENGINE_REPOSITORIES } from './request-document-exception.controller'

@ApiTags('Document Exceptions')
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
@Controller()
export class ListCaseDocumentExceptionsController {
  private readonly getCaseDocumentExceptionsUseCase: GetCaseDocumentExceptionsUseCase

  constructor(
    @Inject(DOCUMENT_ENGINE_REPOSITORIES.documentExceptions)
    private readonly documentExceptionsRepository: DocumentExceptionsRepository,
  ) {
    this.getCaseDocumentExceptionsUseCase = new GetCaseDocumentExceptionsUseCase(
      this.documentExceptionsRepository,
    )
  }

  @Get('/api/cases/:caseId/document-exceptions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all document exceptions for a case' })
  @ApiResponse({ status: 200, description: 'Exceptions returned successfully.' })
  async handle(
    @Param('caseId') caseId: string,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ): Promise<DocumentException[]> {
    const allowedProfiles = ['lawyer', 'paralegal', 'supervisor']
    if (!allowedProfiles.includes(collaborator.profile)) {
      throw new ForbiddenException('You do not have permission to view exceptions.')
    }

    return this.getCaseDocumentExceptionsUseCase.execute({
      caseId,
    })
  }
}
