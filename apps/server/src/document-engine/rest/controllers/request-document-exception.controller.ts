import { Body, Controller, Inject, Param, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { RequestDocumentExceptionUseCase } from '@hms/core/document-engine/use-cases'
import type { DocumentException } from '@hms/core/document-engine/domain/entities'
import type {
  DocumentExceptionsRepository,
  DocumentExceptionAuditLogsRepository,
} from '@hms/core/document-engine/interfaces'
import { AuthGuard, ActiveCollaboratorGuard } from '@/identity/guards'
import { CurrentCollaborator } from '@/identity/decorators'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import type { CaseAccessProvider } from '@hms/core/case-management/interfaces'
import { CASE_MANAGEMENT_ACCESS } from '@/case-management/constants/case-management-access'

export const DOCUMENT_ENGINE_REPOSITORIES = {
  documentExceptions: Symbol('DOCUMENT_ENGINE_REPOSITORIES.documentExceptions'),
  auditLogs: Symbol('DOCUMENT_ENGINE_REPOSITORIES.auditLogs'),
}

export class RequestDocumentExceptionDto {
  documentId?: string
  type!: string
  justification!: string
  deadlineDate?: string
}

@ApiTags('Document Exceptions')
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
@Controller()
export class RequestDocumentExceptionController {
  private readonly requestDocumentExceptionUseCase: RequestDocumentExceptionUseCase

  constructor(
    @Inject(DOCUMENT_ENGINE_REPOSITORIES.documentExceptions)
    private readonly documentExceptionsRepository: DocumentExceptionsRepository,
    @Inject(DOCUMENT_ENGINE_REPOSITORIES.auditLogs)
    private readonly auditLogsRepository: DocumentExceptionAuditLogsRepository,
    @Inject(CASE_MANAGEMENT_ACCESS.access)
    caseAccessProvider: CaseAccessProvider,
  ) {
    this.requestDocumentExceptionUseCase = new RequestDocumentExceptionUseCase(
      this.documentExceptionsRepository,
      this.auditLogsRepository,
      caseAccessProvider,
    )
  }

  @Post('/cases/:caseId/document-exceptions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request a new document exception for a case' })
  @ApiResponse({ status: 201, description: 'Exception requested successfully.' })
  async handle(
    @Param('caseId') caseId: string,
    @Body() body: RequestDocumentExceptionDto,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ): Promise<DocumentException> {
    return this.requestDocumentExceptionUseCase.execute({
      caseId,
      documentId: body.documentId,
      type: body.type,
      justification: body.justification,
      deadlineDate: body.deadlineDate ? new Date(body.deadlineDate) : undefined,
      actorId: collaborator.collaboratorId,
    })
  }
}
