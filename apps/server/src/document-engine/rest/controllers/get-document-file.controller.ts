import { Controller, Get, Param, Inject, HttpStatus, UseGuards } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import { GetDocumentFileUseCase } from '@hms/core/document-engine/use-cases'
import type {
  DocumentBatchesRepository,
  DocumentValidationsRepository,
} from '@hms/core/document-engine/interfaces'
import type { CaseAccessProvider } from '@hms/core/case-management/interfaces'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { DOCUMENT_ENGINE } from '@/document-engine/database/drizzle/constants/documents-repositories'
import { CASE_MANAGEMENT_ACCESS } from '@/case-management/constants/case-management-access'
import { CurrentCollaborator } from '@/identity/decorators'
import { AuthGuard, ActiveCollaboratorGuard } from '@/identity/guards'

@Controller('documents')
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class GetDocumentFileController {
  private readonly useCase: GetDocumentFileUseCase

  constructor(
    @Inject(DOCUMENT_ENGINE.documentBatches)
    documentBatchesRepository: DocumentBatchesRepository,
    @Inject(DOCUMENT_ENGINE.documentValidations)
    documentValidationsRepository: DocumentValidationsRepository,
    @Inject(CASE_MANAGEMENT_ACCESS.access)
    caseAccessProvider: CaseAccessProvider,
  ) {
    this.useCase = new GetDocumentFileUseCase(
      documentBatchesRepository,
      documentValidationsRepository,
      caseAccessProvider,
    )
  }

  @Get('files/:fileId')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'O arquivo foi retornado com sucesso.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Arquivo não encontrado.',
    type: ErrorResponseDto,
  })
  handle(
    @Param('fileId') fileId: string,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.useCase.execute({ fileId, actorId: collaborator.collaboratorId })
  }
}
