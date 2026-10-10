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
import type { CaseMembersRepository } from '@hms/core/case-management/interfaces'
import type { DocumentVersionsRepository } from '@hms/core/document-production/interfaces'
import type {
  DocumentPackagesRepository,
  PackageDocumentsRepository,
} from '@hms/core/document-production/interfaces'
import { SaveEditableDocumentVersionUseCase } from '@hms/core/document-production/use-cases'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import type { DocumentTemplateContent } from '@hms/core/document-production/domain/structures'
import { documentTemplateContentSchema } from '@hms/validation/document-production'
import { ZodValidationPipe } from 'nestjs-zod'

import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
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
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.documentPackages)
    packages: DocumentPackagesRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.packageDocuments)
    packageDocuments: PackageDocumentsRepository,
    @Inject(CASE_MANAGEMENT_REPOSITORIES.caseMembers)
    caseMembers: CaseMembersRepository,
  ) {
    this.useCase = new SaveEditableDocumentVersionUseCase(
      versions,
      packages,
      packageDocuments,
      caseMembers,
    )
  }

  @Patch(':caseId/documents/:documentId/versions/:versionId')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conteúdo editável salvo na versão atual',
  })
  handle(
    @Param('caseId', new ParseUUIDPipe()) caseId: string,
    @Param('documentId', new ParseUUIDPipe()) documentId: string,
    @Param('versionId', new ParseUUIDPipe()) versionId: string,
    @Body(new ZodValidationPipe(documentTemplateContentSchema))
    content: DocumentTemplateContent,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.useCase.execute({
      caseId,
      documentId,
      documentVersionId: versionId,
      collaboratorId: collaborator.collaboratorId,
      content,
    })
  }
}
