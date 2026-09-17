import { Body, Controller, Inject, Param, Post, UseGuards, ForbiddenException } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { ReviewDocumentExceptionUseCase } from '@hms/core/document-engine/use-cases'
import type { DocumentException } from '@hms/core/document-engine/domain/entities'
import type { DocumentExceptionsRepository, DocumentExceptionAuditLogsRepository } from '@hms/core/document-engine/interfaces'
import { AuthGuard, ActiveCollaboratorGuard } from '@/identity/guards'
import { CurrentCollaborator } from '@/identity/decorators'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import { DOCUMENT_ENGINE_REPOSITORIES } from './request-document-exception.controller'

export class ReviewDocumentExceptionDto {
  justification?: string
}

@ApiTags('Document Exceptions')
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
@Controller()
export class ReviewDocumentExceptionController {
  private readonly reviewDocumentExceptionUseCase: ReviewDocumentExceptionUseCase

  constructor(
    @Inject(DOCUMENT_ENGINE_REPOSITORIES.documentExceptions)
    private readonly documentExceptionsRepository: DocumentExceptionsRepository,
    @Inject(DOCUMENT_ENGINE_REPOSITORIES.auditLogs)
    private readonly auditLogsRepository: DocumentExceptionAuditLogsRepository,
  ) {
    this.reviewDocumentExceptionUseCase = new ReviewDocumentExceptionUseCase(
      this.documentExceptionsRepository,
      this.auditLogsRepository,
    )
  }

  @Post('/documents/exceptions/:id/approve')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve a document exception' })
  @ApiResponse({ status: 200, description: 'Exception approved successfully.' })
  async approve(
    @Param('id') id: string,
    @Body() body: ReviewDocumentExceptionDto,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ): Promise<DocumentException> {
    this.checkReviewPermission(collaborator.profile)

    return this.reviewDocumentExceptionUseCase.execute({
      documentExceptionId: id,
      action: 'APPROVE',
      justification: body.justification,
      actorId: collaborator.collaboratorId,
    })
  }

  @Post('/documents/exceptions/:id/reject')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject a document exception' })
  @ApiResponse({ status: 200, description: 'Exception rejected successfully.' })
  async reject(
    @Param('id') id: string,
    @Body() body: ReviewDocumentExceptionDto,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ): Promise<DocumentException> {
    this.checkReviewPermission(collaborator.profile)

    return this.reviewDocumentExceptionUseCase.execute({
      documentExceptionId: id,
      action: 'REJECT',
      justification: body.justification,
      actorId: collaborator.collaboratorId,
    })
  }

  private checkReviewPermission(profile: string) {
    const allowedProfiles = ['lawyer', 'supervisor']
    if (!allowedProfiles.includes(profile)) {
      throw new ForbiddenException('You do not have permission to review exceptions.')
    }
  }
}
