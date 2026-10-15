import { Get, Inject, Param } from '@nestjs/common'
import type { DocumentValidationLogsRepository } from '@hms/core/document-engine/interfaces'
import type { DocumentValidationsRepository } from '@hms/core/document-engine/interfaces'
import type { CaseAccessProvider } from '@hms/core/case-management/interfaces'
import { ListDocumentValidationLogsUseCase } from '@hms/core/document-engine/use-cases'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'

import { DOCUMENT_ENGINE } from '@/document-engine/database/drizzle/constants/documents-repositories'
import { CASE_MANAGEMENT_ACCESS } from '@/case-management/constants/case-management-access'
import { CurrentCollaborator } from '@/identity/decorators'
import { DocumentValidationController } from '../decorators/document-validation-controller'

@DocumentValidationController()
export class ListDocumentValidationLogsController {
  private readonly useCase: ListDocumentValidationLogsUseCase

  constructor(
    @Inject(DOCUMENT_ENGINE.documentValidationLogs)
    documentValidationLogsRepository: DocumentValidationLogsRepository,
    @Inject(DOCUMENT_ENGINE.documentValidations)
    documentValidationsRepository: DocumentValidationsRepository,
    @Inject(CASE_MANAGEMENT_ACCESS.access) caseAccess: CaseAccessProvider,
  ) {
    this.useCase = new ListDocumentValidationLogsUseCase(
      documentValidationLogsRepository,
      documentValidationsRepository,
      caseAccess,
    )
  }

  @Get('documents/:documentFileId/logs')
  handle(
    @Param('documentFileId') documentFileId: string,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.useCase.execute({
      documentFileId,
      actorId: collaborator.collaboratorId,
    })
  }
}
