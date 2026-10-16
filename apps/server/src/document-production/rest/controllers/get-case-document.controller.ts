import {
  Controller,
  Get,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger'
import type {
  CaseAccessProvider,
  LegalCasesRepository,
} from '@hms/core/case-management/interfaces'
import type {
  DocumentGenerationsRepository,
  DocumentPackagesRepository,
  DocumentVersionHomologationsRepository,
  DocumentsRepository,
  DocumentVersionsRepository,
  PackageDocumentsRepository,
} from '@hms/core/document-production/interfaces'
import {
  GetCaseDocumentUseCase,
  ListCaseDocumentsUseCase,
} from '@hms/core/document-production/use-cases'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'

import { CASE_MANAGEMENT_ACCESS } from '@/case-management/constants/case-management-access'
import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import { DOCUMENT_PRODUCTION_REPOSITORIES } from '@/document-production/constants/document-production-repositories'
import { CaseDocumentResponseDto } from '@/document-production/rest/dtos'
import { CurrentCollaborator } from '@/identity/decorators'
import { AuthGuard, ActiveCollaboratorGuard } from '@/identity/guards'

@Controller('cases')
@ApiTags('Case Document Production')
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class GetCaseDocumentController {
  private readonly useCase: GetCaseDocumentUseCase

  constructor(
    @Inject(CASE_MANAGEMENT_REPOSITORIES.legalCases) cases: LegalCasesRepository,
    @Inject(CASE_MANAGEMENT_ACCESS.access) access: CaseAccessProvider,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.documentPackages)
    packages: DocumentPackagesRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.packageDocuments)
    packageDocuments: PackageDocumentsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.documents) documents: DocumentsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.versions)
    versions: DocumentVersionsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.generations)
    generations: DocumentGenerationsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.versionHomologations)
    homologations: DocumentVersionHomologationsRepository,
  ) {
    const listCaseDocuments = new ListCaseDocumentsUseCase(
      cases,
      access,
      packages,
      packageDocuments,
      documents,
      versions,
      generations,
      homologations,
    )
    this.useCase = new GetCaseDocumentUseCase(listCaseDocuments)
  }

  @Get(':caseId/documents/:documentId')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'O documento do Caso foi retornado com sucesso.',
    type: CaseDocumentResponseDto,
  })
  handle(
    @Param('caseId', ParseUUIDPipe) caseId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.useCase
      .execute({ caseId, documentId, actorId: collaborator.collaboratorId })
      .then(CaseDocumentResponseDto.fromDomain)
  }
}
